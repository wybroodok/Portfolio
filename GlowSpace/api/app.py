"""FastAPI сервер для Telegram Mini App.

Запускается в том же процессе что и бот, через asyncio.
Разделяет database/ с ботом.
"""
from __future__ import annotations

import csv
import hashlib
import hmac
import io
import json
import logging
import re
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import parse_qsl, unquote

from aiogram.types import BufferedInputFile
from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from pydantic import BaseModel, Field, field_validator

from config import ADMIN_IDS, BOT_TOKEN
from database.db import async_session
from database.models import Booking, Promotion
from database.requests import (
    cancel_booking_restore_slot,
    cancel_review_request,
    create_booking,
    create_review,
    delete_booking,
    delete_promotion,
    delete_time_slot,
    get_active_promotions,
    get_all_bookings,
    get_all_bot_users,
    get_all_promotions,
    get_all_reviews,
    get_all_slots,
    get_available_slots,
    get_booking_with_relations,
    get_bookings_by_ids,
    get_reviewed_booking_ids,
    get_services,
    get_user_bookings,
    log_booking_action,
    mark_attendance_confirmed,
    register_bot_user,
    schedule_review_request,
    add_time_slot,
    add_service,
    create_promotion,
    block_today_and_cancel,
    delete_service,
    update_booking_status,
    update_promotion,
    update_service,
    update_time_slot,
)
from keyboards.inline import open_app_kb
from utils.dt import now

app = FastAPI(title="CosApp API", docs_url="/api/docs")

STARS = {1: "⭐", 2: "⭐⭐", 3: "⭐⭐⭐", 4: "⭐⭐⭐⭐", 5: "⭐⭐⭐⭐⭐"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class IframeHeadersMiddleware(BaseHTTPMiddleware):
    """Разрешает Telegram встраивать webapp в iframe.

    Cloudflare Tunnel добавляет X-Frame-Options: DENY — перезаписываем его.
    """
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Frame-Options"] = "ALLOWALL"
        response.headers["Content-Security-Policy"] = "frame-ancestors *"
        return response


app.add_middleware(IframeHeadersMiddleware)


# ---------------------------------------------------------------------------
# Утилиты
# ---------------------------------------------------------------------------

def _validate_init_data(init_data: str) -> dict | None:
    """Проверяет подпись Telegram WebApp initData. Возвращает dict или None."""
    try:
        pairs = dict(parse_qsl(init_data, keep_blank_values=True))
        received_hash = pairs.pop("hash", None)
        if not received_hash:
            return None

        data_check_string = "\n".join(
            f"{k}={v}" for k, v in sorted(pairs.items())
        )
        secret_key = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
        expected = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

        if not hmac.compare_digest(expected, received_hash):
            return None

        user_str = pairs.get("user", "{}")
        pairs["user"] = json.loads(user_str)
        return pairs
    except Exception:
        return None


async def get_session():
    async with async_session() as session:
        yield session


async def optional_tg_user(request: Request) -> dict | None:
    """Возвращает Telegram user ТОЛЬКО если подпись X-Init-Data прошла
    HMAC-проверку. Раньше здесь были ещё два запасных пути — "распарсить
    initData без проверки подписи" и доверять заголовку X-Tg-User — оба
    подделываются тривиальным HTTP-заголовком (никакого реального Telegram
    не нужно), что давало полный обход админ-проверки и подмену владельца
    записи. Эти пути убраны: единственный источник доверенной личности —
    криптографически проверенная подпись."""
    init_data = request.headers.get("X-Init-Data", "")
    if not init_data:
        return None
    data = _validate_init_data(init_data)
    return data.get("user") if data else None


async def require_tg_user(request: Request) -> dict:
    """Требует валидный Telegram user. 401 если не прошло."""
    user = await optional_tg_user(request)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid or missing Telegram initData")
    return user


def _is_admin(user: dict | None) -> bool:
    return bool(user) and user["id"] in ADMIN_IDS


def get_bot(request: Request, required: bool = True):
    """Бот кладётся в app.state.bot из main.py при старте. Если приложение
    запущено иначе (например `uvicorn api.app:app` напрямую) — явная ошибка
    вместо AttributeError где-то в середине обработчика.

    required=False — для необязательных уведомлений (создание записи, отзыва
    и т.п.), где отсутствие бота не должно ронять основное действие."""
    bot = getattr(request.app.state, "bot", None)
    if bot is None and required:
        raise HTTPException(status_code=503, detail="Бот не инициализирован")
    return bot


async def _notify_users(bot, recipients: list, send_one) -> int:
    """Общий цикл рассылки: шлёт каждому через send_one(bot, recipient),
    считает успешные отправки и глотает ошибки отдельных получателей
    (заблокировал бота, не открывал ЛС и т.п.) — одна неудача не должна
    прерывать рассылку остальным."""
    if bot is None:
        return 0
    sent = 0
    for recipient in recipients:
        try:
            await send_one(bot, recipient)
            sent += 1
        except Exception:
            pass
    return sent


async def _notify_admins_new_booking(bot, booking, full, name: str, phone: str) -> None:
    async def send_one(bot, admin_id):
        await bot.send_message(
            admin_id,
            f"🆕 <b>Новая запись #{booking.id}</b>\n\n"
            f"Услуга: {full.service.name}\n"
            f"Дата и время: {full.slot.datetime.strftime('%d.%m.%Y %H:%M')}\n"
            f"Клиент: {name}\n"
            f"Телефон: {phone}\n\n"
            "Подтвердить или отклонить — в мини-аппе:",
            reply_markup=open_app_kb("/admin/bookings"),
        )
    await _notify_users(bot, ADMIN_IDS, send_one)


# ---------------------------------------------------------------------------
# Эндпоинты
# ---------------------------------------------------------------------------

@app.get("/api/health")
async def health():
    return {"status": "ok", "time": now().isoformat()}


@app.get("/api/me")
async def get_me(request: Request, session: AsyncSession = Depends(get_session)):
    """Кто авторизован + попутная регистрация в bot_users (для рассылок).

    Раньше регистрация происходила только в обработчике /start, но у бота
    теперь есть отдельная кнопка Mini App от @BotFather, через которую можно
    открыть приложение, ни разу не написав боту /start — такие пользователи
    никогда не попадали в bot_users и не получали рассылки акций. Этот
    эндпоинт вызывается при каждом открытии мини-аппа независимо от точки
    входа, так что регистрируем здесь же — register_bot_user идемпотентна
    (ON CONFLICT DO NOTHING), повторный вызов при каждом заходе безопасен."""
    user = await optional_tg_user(request)
    if user is not None:
        await register_bot_user(session, user["id"])
    return {
        "user": user,
        "is_admin": _is_admin(user),
        "x_init_data_len": len(request.headers.get("X-Init-Data", "")),
        "x_tg_user_raw": unquote(request.headers.get("X-Tg-User", ""))[:200],
        "server_version": "v2",
    }


@app.get("/api/services")
async def list_services(session: AsyncSession = Depends(get_session)):
    services = await get_services(session)
    return [
        {
            "id": s.id,
            "name": s.name,
            "description": s.description,
            "duration": s.duration_minutes,
            "price": s.price,
        }
        for s in services
    ]


@app.get("/api/slots")
async def list_slots(date: str, session: AsyncSession = Depends(get_session)):
    """date формат: YYYY-MM-DD"""
    try:
        dt = datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="date must be YYYY-MM-DD")

    slots = await get_available_slots(session, dt)
    return [{"id": sl.id, "datetime": sl.datetime.isoformat()} for sl in slots]


# ---------------------------------------------------------------------------
# Акции
# ---------------------------------------------------------------------------

@app.get("/api/promotions")
async def list_promotions(session: AsyncSession = Depends(get_session)):
    promos = await get_active_promotions(session)
    return [
        {
            "id": p.id,
            "text": p.text,
            "end_date": p.end_date.date().isoformat(),
            "has_photo": p.photo_file_id is not None,
        }
        for p in promos
    ]


@app.get("/api/promotions/{promo_id}/photo")
async def promotion_photo(
    promo_id: int,
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    """Отдаёт фото акции, проксируя его из Telegram по сохранённому file_id."""
    promo = await session.get(Promotion, promo_id)
    if promo is None or not promo.photo_file_id:
        raise HTTPException(status_code=404, detail="Фото не найдено")
    bot = get_bot(request)
    try:
        file = await bot.get_file(promo.photo_file_id)
        buf = io.BytesIO()
        await bot.download_file(file.file_path, destination=buf)
    except Exception:
        # file_id мог устареть (Telegram периодически их инвалидирует) —
        # чистая 404 вместо необработанного 500 от aiogram.
        raise HTTPException(status_code=404, detail="Фото недоступно")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/jpeg")


# ---------------------------------------------------------------------------
# Записи (клиент)
# ---------------------------------------------------------------------------

_PHONE_RE = re.compile(r"^\+?[\d\s\-()]+$")


class BookingCreate(BaseModel):
    service_id: int
    slot_id: int
    name: str
    phone: str

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        # Дублирует проверку из формы (Booking.tsx) — здесь на случай прямого
        # запроса к API в обход интерфейса.
        v = v.strip()
        if not v:
            raise ValueError("Имя не может быть пустым")
        return v

    @field_validator("phone")
    @classmethod
    def phone_looks_valid(cls, v: str) -> str:
        # Не проверяем, что номер реально существует — только что он похож на
        # российский мобильный (те же правила, что и на клиенте в Booking.tsx).
        # Раньше проверялось только количество цифр (10-15) — под это подходил
        # вообще любой набор цифр произвольной страны/формата. Теперь: после
        # нормализации (ведущая 8 — обычная запись +7 в России — заменяется
        # на 7) должно получиться ровно 11 цифр, начинающихся на 7.
        v = v.strip()
        if not _PHONE_RE.match(v):
            raise ValueError("Некорректный номер телефона")
        digits = "".join(c for c in v if c.isdigit())
        if len(digits) == 11 and digits.startswith("8"):
            digits = "7" + digits[1:]
        if len(digits) != 11 or not digits.startswith("7"):
            raise ValueError("Некорректный номер телефона")
        return v


@app.post("/api/bookings")
async def create_booking_endpoint(
    body: BookingCreate,
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    user = await optional_tg_user(request)
    # Если Telegram-авторизация недоступна (weba/браузер) — используем 0 как анонимный ID
    user_id = user["id"] if user else 0
    actor_name = body.name

    booking = await create_booking(
        session,
        user_id=user_id,
        user_name=body.name,
        phone=body.phone,
        service_id=body.service_id,
        slot_id=body.slot_id,
    )
    if booking is None:
        raise HTTPException(status_code=409, detail="Слот уже занят или у вас уже есть запись на это время")

    full = await get_booking_with_relations(session, booking.id)
    await log_booking_action(
        session,
        booking_id=booking.id,
        action="created",
        actor_id=user_id,
        actor_name=actor_name,
        service_name=full.service.name,
        slot_dt=full.slot.datetime,
    )
    await _notify_admins_new_booking(get_bot(request, required=False), booking, full, body.name, body.phone)
    return {
        "id": booking.id,
        "service": full.service.name,
        "datetime": full.slot.datetime.isoformat(),
        "price": full.service.price,
        "status": booking.status,
    }


async def _serialize_bookings(session: AsyncSession, bookings: list[Booking]) -> list[dict]:
    reviewed_ids = await get_reviewed_booking_ids(session, [b.id for b in bookings])
    current = now()
    return [
        {
            "id": b.id,
            "service": {"id": b.service.id, "name": b.service.name, "price": b.service.price, "duration": b.service.duration_minutes},
            "slot": {"id": b.slot.id, "datetime": b.slot.datetime.isoformat()},
            "status": b.status,
            "is_past": b.slot.datetime <= current,
            "has_review": b.id in reviewed_ids,
            # reminder_sent значит "24ч-напоминание уже отправлено планировщиком" —
            # отдельно от attendance_confirmed ("клиент подтвердил сам, заранее").
            # Раньше эти два события ошибочно делили один флаг, из-за чего досрочное
            # подтверждение через мини-апп гасило будущее напоминание.
            "needs_attendance_confirm": (
                b.status == "confirmed"
                and not b.attendance_confirmed
                and current < b.slot.datetime <= current + timedelta(hours=48)
            ),
        }
        for b in bookings
    ]


@app.get("/api/bookings/me")
async def my_bookings(
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    user = await optional_tg_user(request)
    if user is None:
        raise HTTPException(status_code=401, detail="NO_TG_AUTH")
    bookings = await get_user_bookings(session, user["id"])
    active = [b for b in bookings if b.status in ("pending", "confirmed")]
    return await _serialize_bookings(session, active)


@app.get("/api/bookings/by-ids")
async def bookings_by_ids(
    ids: str,
    session: AsyncSession = Depends(get_session),
):
    """Получить записи по списку ID (без авторизации — для localStorage-режима)."""
    try:
        id_list = [int(i) for i in ids.split(",") if i.strip()]
    except ValueError:
        raise HTTPException(status_code=400, detail="ids must be comma-separated integers")
    bookings = await get_bookings_by_ids(session, id_list)
    return await _serialize_bookings(session, bookings)


@app.delete("/api/bookings/{booking_id}")
async def cancel_booking_endpoint(
    booking_id: int,
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    user = await optional_tg_user(request)
    user_id = user["id"] if user else None
    cancelled = await cancel_booking_restore_slot(
        session, booking_id, user_id=user_id, require_ownership=True,
    )
    if cancelled is None:
        raise HTTPException(status_code=404, detail="Запись не найдена или уже отменена")
    await cancel_review_request(session, booking_id)
    actor_id = user_id or 0
    await log_booking_action(
        session,
        booking_id=booking_id,
        action="cancelled_client",
        actor_id=actor_id,
        actor_name=cancelled.user_name,
        service_name=cancelled.service.name,
        slot_dt=cancelled.slot.datetime,
        note="отменено через webapp",
    )
    return {"cancelled": True}


# ---------------------------------------------------------------------------
# Отзывы (клиент)
# ---------------------------------------------------------------------------

class ReviewCreate(BaseModel):
    booking_id: int
    rating: int
    comment: str | None = None


def _check_booking_ownership(user: dict | None, booking: object) -> None:
    """Анонимную запись (user_id=0 — без Telegram-авторизации, localStorage-режим)
    может подтвердить/оценить кто угодно, кто знает ID записи — так же, как её
    можно отменить (см. cancel_booking_restore_slot). Но если запись создана
    с реальным Telegram ID, действие обязано пройти проверенную Telegram-
    авторизацию ИМЕННО этого пользователя: отсутствие авторизации отклоняется,
    а не молча пропускается — иначе кто угодно мог бы подтвердить/оценить
    чужую запись, просто не присылая заголовков вовсе."""
    if booking.user_id == 0:
        return
    if user is None or booking.user_id != user["id"]:
        raise HTTPException(status_code=403, detail="Это не ваша запись")


@app.post("/api/reviews")
async def create_review_endpoint(
    body: ReviewCreate,
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    if not (1 <= body.rating <= 5):
        raise HTTPException(status_code=400, detail="Оценка должна быть от 1 до 5")

    full = await get_booking_with_relations(session, body.booking_id)
    if full is None or full.status != "confirmed":
        raise HTTPException(status_code=404, detail="Запись не найдена или не подтверждена")
    if full.slot.datetime > now():
        raise HTTPException(status_code=400, detail="Отзыв можно оставить только после визита")

    user = await optional_tg_user(request)
    _check_booking_ownership(user, full)
    # Если авторизован — берём id/имя из Telegram; иначе доверяем владельцу записи
    # (localStorage-режим, как и у отмены записи)
    user_id = user["id"] if user else full.user_id
    user_name = (user.get("first_name") if user else None) or full.user_name

    try:
        review = await create_review(
            session,
            booking_id=body.booking_id,
            user_id=user_id,
            user_name=user_name,
            rating=body.rating,
            comment=body.comment,
        )
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=409, detail="Отзыв на эту запись уже оставлен")

    # Отзыв уже оставлен через мини-апп — гасим ещё не отправленный автозапрос от бота
    await cancel_review_request(session, body.booking_id)

    text = f"⭐ Новый отзыв — {STARS[body.rating]}"
    if body.comment:
        text += f"\n\n💬 {body.comment}"
    await _notify_users(
        get_bot(request, required=False), ADMIN_IDS,
        lambda bot, admin_id: bot.send_message(admin_id, text),
    )

    return {"id": review.id}


@app.post("/api/bookings/{booking_id}/confirm-attendance")
async def confirm_attendance(
    booking_id: int,
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    """Клиент подтверждает завтрашнюю запись (аналог кнопки '✅ Да, буду!' в напоминании бота)."""
    full = await get_booking_with_relations(session, booking_id)
    if full is None or full.status not in ("pending", "confirmed"):
        raise HTTPException(status_code=404, detail="Запись не найдена")

    user = await optional_tg_user(request)
    _check_booking_ownership(user, full)

    await mark_attendance_confirmed(session, booking_id)

    async def send_one(bot, admin_id):
        await bot.send_message(
            admin_id,
            f"✅ Клиент подтвердил запись через мини-апп!\n\n"
            f"📅 {full.slot.datetime.strftime('%d.%m.%Y %H:%M')}\n"
            f"💆 {full.service.name}\n"
            f"👤 {full.user_name}\n"
            f"📞 {full.phone}",
        )
    await _notify_users(get_bot(request, required=False), ADMIN_IDS, send_one)

    return {"status": "confirmed"}


# ---------------------------------------------------------------------------
# Админ эндпоинты
# ---------------------------------------------------------------------------

def require_admin(user: dict = Depends(require_tg_user)) -> dict:
    if not _is_admin(user):
        raise HTTPException(status_code=403, detail="Доступ запрещён")
    return user


@app.get("/api/admin/bookings")
async def admin_all_bookings(
    _: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    bookings = await get_all_bookings(session)
    return [
        {
            "id": b.id,
            "service": {"id": b.service.id, "name": b.service.name, "price": b.service.price},
            "slot": {"id": b.slot.id, "datetime": b.slot.datetime.isoformat()},
            "user_name": b.user_name,
            "phone": b.phone,
            "status": b.status,
            "created_at": b.created_at.isoformat(),
        }
        for b in bookings
    ]


@app.post("/api/admin/bookings/{booking_id}/confirm")
async def admin_confirm_booking(
    booking_id: int,
    admin: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    full = await get_booking_with_relations(session, booking_id)
    if full is None or full.status == "cancelled":
        raise HTTPException(status_code=404, detail="Запись не найдена")
    if full.status == "confirmed":
        # Уже подтверждена (двойной клик/повторный запрос) — идемпотентный
        # no-op, а не повторное планирование отзыва и дубль в audit-логе.
        return {"status": "confirmed"}
    await update_booking_status(session, booking_id, "confirmed")
    # user_id=0 — анонимная запись без Telegram-авторизации (браузер/localStorage-режим):
    # прислать напоминание об отзыве некому, чужой chat_id не существует.
    if full.user_id != 0:
        review_at = full.slot.datetime + timedelta(minutes=full.service.duration_minutes + 120)
        await schedule_review_request(
            session,
            booking_id=booking_id,
            user_id=full.user_id,
            service_name=full.service.name,
            scheduled_at=review_at,
        )
    await log_booking_action(session, booking_id, "confirmed", admin["id"],
                             service_name=full.service.name, slot_dt=full.slot.datetime)
    return {"status": "confirmed"}


@app.post("/api/admin/bookings/{booking_id}/cancel")
async def admin_cancel_booking(
    booking_id: int,
    admin: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    cancelled = await cancel_booking_restore_slot(session, booking_id)
    if cancelled is None:
        raise HTTPException(status_code=404, detail="Запись не найдена или уже отменена")
    await cancel_review_request(session, booking_id)
    await log_booking_action(session, booking_id, "cancelled_admin", admin["id"],
                             service_name=cancelled.service.name, slot_dt=cancelled.slot.datetime,
                             note="отменено через webapp-админку")
    return {"status": "cancelled"}


@app.delete("/api/admin/bookings/{booking_id}")
async def admin_delete_booking(
    booking_id: int,
    admin: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    info = await delete_booking(session, booking_id)
    if info is None:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    await log_booking_action(session, booking_id, "deleted_admin", admin["id"],
                             service_name=info["service_name"], slot_dt=info["slot_datetime"],
                             note="безвозвратно удалено через webapp-админку")
    return {"status": "deleted"}


class SlotCreate(BaseModel):
    datetime: str  # ISO: YYYY-MM-DDTHH:MM


class ServiceCreate(BaseModel):
    name: str
    description: str = ""
    duration_minutes: int = Field(60, gt=0)
    price: int = Field(gt=0)


def _slot_dict(slot) -> dict:
    # Единая форма ответа для всех admin/slots-эндпоинтов — раньше каждый
    # собирал JSON вручную, и один из них (update) забыл is_available:
    # фронтенд получал слот без этого поля и рисовал его как "занят" до
    # следующей перезагрузки списка.
    return {"id": slot.id, "datetime": slot.datetime.isoformat(), "is_available": slot.is_available}


@app.post("/api/admin/slots")
async def admin_add_slot(
    body: SlotCreate,
    _: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    try:
        dt = datetime.fromisoformat(body.datetime)
    except ValueError:
        raise HTTPException(status_code=400, detail="Неверный формат datetime")
    if dt < now():
        raise HTTPException(status_code=400, detail="Дата уже прошла")
    slot = await add_time_slot(session, dt)
    return _slot_dict(slot)


@app.get("/api/admin/slots")
async def admin_list_slots(
    _: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    slots = await get_all_slots(session)
    return [_slot_dict(s) for s in slots]


@app.put("/api/admin/slots/{slot_id}")
async def admin_update_slot(
    slot_id: int,
    body: SlotCreate,
    _: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    try:
        dt = datetime.fromisoformat(body.datetime)
    except ValueError:
        raise HTTPException(status_code=400, detail="Неверный формат datetime")
    if dt < now():
        raise HTTPException(status_code=400, detail="Дата уже прошла")
    slot = await update_time_slot(session, slot_id, dt)
    if slot is None:
        raise HTTPException(
            status_code=409,
            detail="Слот не найден или на него уже есть запись — сначала отмените запись",
        )
    return _slot_dict(slot)


@app.delete("/api/admin/slots/{slot_id}")
async def admin_delete_slot(
    slot_id: int,
    _: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    ok = await delete_time_slot(session, slot_id)
    if not ok:
        raise HTTPException(
            status_code=409,
            detail="Слот не найден или на него уже есть запись — сначала отмените запись",
        )
    return {"status": "deleted"}


@app.post("/api/admin/services")
async def admin_add_service(
    body: ServiceCreate,
    _: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    svc = await add_service(session, body.name, body.description, body.duration_minutes, body.price)
    return {"id": svc.id, "name": svc.name}


@app.put("/api/admin/services/{service_id}")
async def admin_update_service(
    service_id: int,
    body: ServiceCreate,
    _: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    svc = await update_service(session, service_id, body.name, body.description, body.duration_minutes, body.price)
    if svc is None:
        raise HTTPException(status_code=404, detail="Услуга не найдена")
    return {"id": svc.id, "name": svc.name}


@app.delete("/api/admin/services/{service_id}")
async def admin_delete_service(
    service_id: int,
    _: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    result = await delete_service(session, service_id)
    if result == "not_found":
        raise HTTPException(status_code=404, detail="Услуга не найдена")
    if result == "has_bookings":
        raise HTTPException(
            status_code=409,
            detail="На эту услугу есть записи (в т.ч. старые) — удаление сломало бы их историю",
        )
    return {"status": "deleted"}


@app.get("/api/admin/reviews")
async def admin_reviews(
    _: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    reviews = await get_all_reviews(session)
    return [
        {
            "id": r.id,
            "user_name": r.user_name,
            "rating": r.rating,
            "comment": r.comment,
            "created_at": r.created_at.isoformat(),
        }
        for r in reviews
    ]


@app.get("/api/admin/reviews/export")
async def admin_reviews_export(
    _: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    reviews = await get_all_reviews(session)
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["id", "booking_id", "user_id", "user_name", "rating", "comment", "created_at"])
    for r in reviews:
        writer.writerow([
            r.id, r.booking_id, r.user_id, r.user_name,
            r.rating, r.comment or "",
            r.created_at.strftime("%d.%m.%Y %H:%M"),
        ])
    content = buf.getvalue().encode("utf-8-sig")  # BOM для корректного открытия в Excel
    return StreamingResponse(
        io.BytesIO(content),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=reviews.csv"},
    )


def _parse_promo_end_date(end_date: str) -> datetime:
    try:
        end_dt = datetime.strptime(end_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Неверный формат end_date")
    # Сравниваем с концом дня — иначе сегодняшняя дата отклоняется как "прошедшая"
    # в любой момент после полуночи.
    end_of_day = end_dt.replace(hour=23, minute=59, second=59)
    if end_of_day < now():
        raise HTTPException(status_code=400, detail="Дата уже прошла")
    return end_dt


async def _upload_promo_photo(bot, admin_id: int, photo: UploadFile) -> str:
    photo_bytes = await photo.read()
    # Загружаем фото в Telegram через ЛС админу, чтобы получить file_id —
    # дальше он переиспользуется при рассылке всем пользователям бота.
    try:
        uploaded = await bot.send_photo(
            admin_id,
            BufferedInputFile(photo_bytes, filename=photo.filename),
            caption="🎁 Предпросмотр акции (это сообщение не увидят клиенты)",
        )
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Не удалось загрузить фото в Telegram. Убедитесь, что вы "
                   "запускали бота в личном чате (/start), и что файл — изображение.",
        )
    return uploaded.photo[-1].file_id


@app.post("/api/admin/promos")
async def admin_add_promo(
    request: Request,
    admin: dict = Depends(require_admin),
    text: str = Form(""),
    end_date: str = Form(...),  # YYYY-MM-DD
    photo: UploadFile | None = File(None),
    session: AsyncSession = Depends(get_session),
):
    end_dt = _parse_promo_end_date(end_date)
    bot = get_bot(request)
    photo_file_id = None
    if photo is not None and photo.filename:
        # Telegram ограничивает подпись к фото 1024 символами (у обычных
        # сообщений — 4096); клиент уже режет ввод по этому лимиту, но
        # проверяем и на сервере — иначе рассылка тихо провалится у всех
        # получателей разом (см. _notify_users, глотает ошибки поштучно).
        if len(text) > 1024:
            raise HTTPException(status_code=400, detail="Текст с фото не может быть длиннее 1024 символов")
        photo_file_id = await _upload_promo_photo(bot, admin["id"], photo)

    promo = await create_promotion(session, text, photo_file_id, end_dt)
    users = await get_all_bot_users(session)

    async def send_promo(bot, user):
        if promo.photo_file_id:
            await bot.send_photo(user.user_id, promo.photo_file_id, caption=promo.text or None)
        else:
            await bot.send_message(user.user_id, promo.text)

    sent = await _notify_users(bot, users, send_promo)
    return {"id": promo.id, "sent": sent, "total": len(users)}


@app.get("/api/admin/promotions")
async def admin_list_promotions(
    _: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    promos = await get_all_promotions(session)
    return [
        {
            "id": p.id,
            "text": p.text,
            "has_photo": p.photo_file_id is not None,
            "end_date": p.end_date.isoformat(),
            "is_active": p.is_active,
        }
        for p in promos
    ]


@app.put("/api/admin/promos/{promo_id}")
async def admin_update_promo(
    request: Request,
    promo_id: int,
    admin: dict = Depends(require_admin),
    text: str = Form(""),
    end_date: str = Form(...),
    remove_photo: bool = Form(False),
    photo: UploadFile | None = File(None),
    session: AsyncSession = Depends(get_session),
):
    """Редактирование не рассылает акцию заново — только меняет то, что уже
    показывается в разделе "Акции"; повторная рассылка была бы спамом при
    правке опечатки."""
    end_dt = _parse_promo_end_date(end_date)
    if photo is not None and photo.filename and len(text) > 1024:
        raise HTTPException(status_code=400, detail="Текст с фото не может быть длиннее 1024 символов")
    photo_file_id = None
    if photo is not None and photo.filename:
        photo_file_id = await _upload_promo_photo(get_bot(request), admin["id"], photo)
    promo = await update_promotion(
        session, promo_id, text, end_dt,
        photo_file_id=photo_file_id, clear_photo=remove_photo and photo_file_id is None,
    )
    if promo is None:
        raise HTTPException(status_code=404, detail="Акция не найдена")
    return {"id": promo.id, "has_photo": promo.photo_file_id is not None, "end_date": promo.end_date.isoformat()}


@app.delete("/api/admin/promos/{promo_id}")
async def admin_delete_promo(
    promo_id: int,
    _: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    ok = await delete_promotion(session, promo_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Акция не найдена")
    return {"status": "deleted"}


@app.post("/api/admin/day-block")
async def admin_day_block(
    request: Request,
    admin: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    cancelled = await block_today_and_cancel(session)
    for b in cancelled:
        await log_booking_action(
            session,
            booking_id=b["booking_id"],
            action="cancelled_day_block",
            actor_id=admin["id"],
            service_name=b["service_name"],
            slot_dt=b["slot_datetime"],
            note="администратор заблокировал день через webapp",
        )

    bot = get_bot(request)

    async def send_day_block_notice(bot, b):
        slot_str = b["slot_datetime"].strftime("%d.%m.%Y %H:%M")
        await bot.send_message(
            b["user_id"],
            f"⚠️ Ваша запись на <b>{slot_str}</b> ({b['service_name']}) "
            "была отменена из-за форс-мажора у мастера.\n\n"
            "Приносим извинения. Вы можете записаться на другой день.",
        )

    notified = await _notify_users(bot, cancelled, send_day_block_notice)
    return {"cancelled_count": len(cancelled), "notified_count": notified}


# ---------------------------------------------------------------------------
# Раздача статики webapp (должна быть ПОСЛЕДНЕЙ — catch-all)
# ---------------------------------------------------------------------------

_DIST = Path(__file__).parent.parent / "webapp" / "dist"

# FileResponse определяет media_type по расширению через mimetypes и НЕ
# добавляет charset для текстовых типов — без него браузер вынужден
# угадывать кодировку сам и может ошибиться на кириллице/эмодзи в JS-бандле
# и HTML (Netlify отдаёт charset=UTF-8 сама, поэтому там всё было в порядке).
_TEXT_MEDIA_TYPES = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".svg": "image/svg+xml",
}


@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """Отдаёт собранный React webapp. Файлы — напрямую, SPA-роуты — index.html."""
    target = _DIST / full_path
    if not target.is_file():
        target = _DIST / "index.html"
    media_type = _TEXT_MEDIA_TYPES.get(target.suffix)
    if media_type:
        return FileResponse(target, media_type=f"{media_type}; charset=utf-8")
    return FileResponse(target)
