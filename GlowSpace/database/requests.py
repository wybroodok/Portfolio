import logging
from datetime import datetime, timedelta

from sqlalchemy import delete, func, select, update
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database.models import Booking, BookingLog, BotUser, Promotion, Review, ReviewRequest, Service, TimeSlot
from utils.dt import now


async def get_services(session: AsyncSession) -> list[Service]:
    result = await session.execute(select(Service))
    return list(result.scalars().all())


async def get_service(session: AsyncSession, service_id: int) -> Service | None:
    return await session.get(Service, service_id)


async def get_available_slots(session: AsyncSession, date: datetime) -> list[TimeSlot]:
    day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = day_start + timedelta(days=1)
    result = await session.execute(
        select(TimeSlot).where(
            TimeSlot.is_available == True,
            TimeSlot.datetime >= day_start,
            TimeSlot.datetime < day_end,
            TimeSlot.datetime > now(),  # нельзя записаться в прошлое
        ).order_by(TimeSlot.datetime)
    )
    return list(result.scalars().all())


async def create_booking(
    session: AsyncSession,
    user_id: int,
    user_name: str,
    phone: str,
    service_id: int,
    slot_id: int,
) -> Booking | None:
    """Атомично блокирует слот и создаёт бронирование.

    Возвращает None если:
    - слот занят кем-то другим (race condition / rowcount=0)
    - у этого пользователя уже есть активная запись на то же дату и время
    """
    # Загружаем слот, чтобы знать datetime для проверки дубля
    slot = await session.get(TimeSlot, slot_id)
    if slot is None or not slot.is_available:
        return None

    # Запрещаем одному пользователю иметь две активные записи на одно время.
    # Анонимные записи (user_id=0 — без Telegram-авторизации) все делят один
    # и тот же user_id, так что этот дубль-чек для них бессмысленен и только
    # ложно блокирует НЕ связанных друг с другом анонимных клиентов, решивших
    # записаться на одно и то же время; атомарная блокировка слота ниже всё
    # равно не даст занять один и тот же slot_id дважды.
    if user_id != 0:
        dup = await session.execute(
            select(Booking.id)
            .join(TimeSlot, Booking.slot_id == TimeSlot.id)
            .where(
                Booking.user_id == user_id,
                Booking.status.in_(["pending", "confirmed"]),
                TimeSlot.datetime == slot.datetime,
            )
            .limit(1)
        )
        if dup.scalar_one_or_none() is not None:
            return None  # дубль: у пользователя уже есть запись в это время

    # Атомично блокируем слот; если кто-то занял его между проверкой выше и здесь — выходим
    result = await session.execute(
        update(TimeSlot)
        .where(TimeSlot.id == slot_id, TimeSlot.is_available == True)
        .values(is_available=False)
    )
    if result.rowcount == 0:
        return None  # слот занят — кто-то успел раньше

    booking = Booking(
        user_id=user_id,
        user_name=user_name,
        phone=phone,
        service_id=service_id,
        slot_id=slot_id,
    )
    session.add(booking)
    await session.commit()
    await session.refresh(booking)
    return booking


async def get_user_bookings(session: AsyncSession, user_id: int) -> list[Booking]:
    result = await session.execute(
        select(Booking)
        .options(selectinload(Booking.service), selectinload(Booking.slot))
        .where(Booking.user_id == user_id)
        .order_by(Booking.created_at.desc())
    )
    return list(result.scalars().all())


async def get_bookings_by_ids(session: AsyncSession, ids: list[int]) -> list[Booking]:
    if not ids:
        return []
    result = await session.execute(
        select(Booking)
        .options(selectinload(Booking.service), selectinload(Booking.slot))
        .where(Booking.id.in_(ids))
        .order_by(Booking.created_at.desc())
    )
    return list(result.scalars().all())


async def get_all_bookings(session: AsyncSession) -> list[Booking]:
    result = await session.execute(
        select(Booking)
        .options(selectinload(Booking.service), selectinload(Booking.slot))
        .order_by(Booking.created_at.desc())
    )
    return list(result.scalars().all())


async def update_booking_status(
    session: AsyncSession, booking_id: int, status: str
) -> None:
    await session.execute(
        update(Booking).where(Booking.id == booking_id).values(status=status)
    )
    await session.commit()


async def cancel_booking_restore_slot(
    session: AsyncSession,
    booking_id: int,
    user_id: int | None = None,
    require_ownership: bool = False,
) -> Booking | None:
    """Отменяет бронирование и возвращает слот в доступные.

    require_ownership=True (клиентская самоотмена) — анонимную запись
    (user_id=0, без Telegram-авторизации) может отменить кто угодно, кто
    знает её ID (localStorage-режим); запись с реальным Telegram ID — только
    прошедший проверку пользователь с совпадающим user_id (отсутствие
    авторизации отклоняется, а не пропускается молча).
    require_ownership=False (по умолчанию, админ-отмена через require_admin)
    — владелец не проверяется вовсе.

    Возвращает объект Booking при успехе (с загруженными service и slot),
    None — если запись не найдена, уже отменена или принадлежит другому пользователю.
    """
    result = await session.execute(
        select(Booking)
        .options(selectinload(Booking.service), selectinload(Booking.slot))
        .where(Booking.id == booking_id)
    )
    booking = result.scalar_one_or_none()

    if not booking or booking.status == "cancelled":
        return None
    if require_ownership and booking.user_id != 0 and booking.user_id != user_id:
        return None

    booking.status = "cancelled"
    await session.execute(
        update(TimeSlot).where(TimeSlot.id == booking.slot_id).values(is_available=True)
    )
    await session.commit()
    return booking


async def delete_booking(session: AsyncSession, booking_id: int) -> dict | None:
    """Безвозвратно удаляет запись (не путать с отменой — cancel просто меняет
    статус и освобождает слот, эта запись остаётся в списке). Используется
    админкой для очистки старых отменённых записей. Возвращает данные записи
    для аудит-лога вызывающей стороной — читать поля из ORM-объекта уже
    после commit нельзя (SQLAlchemy истекает атрибуты, а строка удалена).
    Если слот при этом ещё числится занятым (запись не была отменена перед
    удалением) — освобождаем его, иначе он навсегда останется недоступным
    для новых записей."""
    result = await session.execute(
        select(Booking)
        .options(selectinload(Booking.service), selectinload(Booking.slot))
        .where(Booking.id == booking_id)
    )
    booking = result.scalar_one_or_none()
    if booking is None:
        return None
    info = {
        "service_name": booking.service.name,
        "slot_datetime": booking.slot.datetime,
        "status": booking.status,
    }
    if booking.status != "cancelled" and not booking.slot.is_available:
        await session.execute(
            update(TimeSlot).where(TimeSlot.id == booking.slot_id).values(is_available=True)
        )
    await session.execute(delete(ReviewRequest).where(ReviewRequest.booking_id == booking_id))
    await session.execute(delete(Review).where(Review.booking_id == booking_id))
    await session.delete(booking)
    await session.commit()
    return info


async def log_booking_action(
    session: AsyncSession,
    booking_id: int,
    action: str,
    actor_id: int,
    actor_name: str = "",
    service_name: str = "",
    slot_dt: datetime | None = None,
    note: str = "",
) -> None:
    session.add(BookingLog(
        booking_id=booking_id,
        action=action,
        actor_id=actor_id,
        actor_name=actor_name,
        service_name=service_name,
        slot_dt=slot_dt,
        note=note,
    ))
    await session.commit()


async def block_today_and_cancel(session: AsyncSession) -> list[dict]:
    """Блокирует все слоты на сегодня и отменяет активные бронирования.

    Возвращает список dict с данными отменённых записей для уведомления клиентов.
    """
    today_start = now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    slots_result = await session.execute(
        select(TimeSlot).where(
            TimeSlot.datetime >= today_start,
            TimeSlot.datetime < today_end,
        )
    )
    slots = list(slots_result.scalars().all())
    if not slots:
        return []

    slot_ids = [s.id for s in slots]

    bookings_result = await session.execute(
        select(Booking)
        .options(selectinload(Booking.service), selectinload(Booking.slot))
        .where(
            Booking.slot_id.in_(slot_ids),
            Booking.status.in_(["pending", "confirmed"]),
        )
    )
    active_bookings = list(bookings_result.scalars().all())

    cancelled_info = []
    cancelled_ids = []
    for b in active_bookings:
        b.status = "cancelled"
        cancelled_ids.append(b.id)
        cancelled_info.append({
            "user_id": b.user_id,
            "booking_id": b.id,
            "slot_datetime": b.slot.datetime,
            "service_name": b.service.name,
        })

    await session.execute(
        update(TimeSlot).where(TimeSlot.id.in_(slot_ids)).values(is_available=False)
    )

    if cancelled_ids:
        await session.execute(
            delete(ReviewRequest).where(
                ReviewRequest.booking_id.in_(cancelled_ids),
                ReviewRequest.sent == False,
            )
        )

    await session.commit()
    return cancelled_info


async def add_time_slot(session: AsyncSession, dt: datetime) -> TimeSlot:
    slot = TimeSlot(datetime=dt)
    session.add(slot)
    await session.commit()
    await session.refresh(slot)
    return slot


async def get_all_slots(session: AsyncSession) -> list[TimeSlot]:
    """Все будущие слоты (и свободные, и уже занятые записью) — для админки."""
    result = await session.execute(
        select(TimeSlot).where(TimeSlot.datetime > now()).order_by(TimeSlot.datetime)
    )
    return list(result.scalars().all())


async def update_time_slot(session: AsyncSession, slot_id: int, dt: datetime) -> TimeSlot | None:
    """Переносит время слота. Только для свободных слотов — если на слот уже
    есть активная запись, перенос времени незаметно для клиента сдвинул бы
    его запись; сначала нужно отменить или переназначить саму запись."""
    slot = await session.get(TimeSlot, slot_id)
    if slot is None or not slot.is_available:
        return None
    slot.datetime = dt
    await session.commit()
    await session.refresh(slot)
    return slot


async def delete_time_slot(session: AsyncSession, slot_id: int) -> bool:
    """Удаляет слот. Только свободный — иначе осиротим существующую запись."""
    slot = await session.get(TimeSlot, slot_id)
    if slot is None or not slot.is_available:
        return False
    await session.delete(slot)
    await session.commit()
    return True


async def get_booking_with_relations(session: AsyncSession, booking_id: int) -> Booking | None:
    result = await session.execute(
        select(Booking)
        .options(selectinload(Booking.service), selectinload(Booking.slot))
        .where(Booking.id == booking_id)
    )
    return result.scalar_one_or_none()


# --- Отзывы ---

async def schedule_review_request(
    session: AsyncSession,
    booking_id: int,
    user_id: int,
    service_name: str,
    scheduled_at: datetime,
) -> None:
    req = ReviewRequest(
        booking_id=booking_id,
        user_id=user_id,
        service_name=service_name,
        scheduled_at=scheduled_at,
    )
    session.add(req)
    try:
        await session.commit()
    except Exception:
        # booking_id unique — обычно это повторное подтверждение той же записи,
        # но логируем на случай, если причина другая (например, реальная ошибка БД),
        # иначе отзыв для клиента просто никогда не запланируется без единого следа.
        await session.rollback()
        logging.exception("Не удалось запланировать запрос отзыва для booking_id=%s", booking_id)


async def cancel_review_request(session: AsyncSession, booking_id: int) -> None:
    await session.execute(
        delete(ReviewRequest).where(
            ReviewRequest.booking_id == booking_id,
            ReviewRequest.sent == False,
        )
    )
    await session.commit()


async def get_pending_review_requests(session: AsyncSession) -> list[ReviewRequest]:
    result = await session.execute(
        select(ReviewRequest).where(
            ReviewRequest.sent == False,
            ReviewRequest.scheduled_at <= now(),
        )
    )
    return list(result.scalars().all())


async def mark_review_sent(session: AsyncSession, review_request_id: int) -> None:
    await session.execute(
        update(ReviewRequest).where(ReviewRequest.id == review_request_id).values(sent=True)
    )
    await session.commit()


async def create_review(
    session: AsyncSession,
    booking_id: int,
    user_id: int,
    user_name: str,
    rating: int,
    comment: str | None,
) -> Review:
    review = Review(
        booking_id=booking_id,
        user_id=user_id,
        user_name=user_name,
        rating=rating,
        comment=comment,
    )
    session.add(review)
    await session.commit()
    return review


async def get_all_reviews(session: AsyncSession) -> list[Review]:
    result = await session.execute(
        select(Review).order_by(Review.created_at.desc())
    )
    return list(result.scalars().all())


async def get_reviewed_booking_ids(session: AsyncSession, booking_ids: list[int]) -> set[int]:
    """Из переданных ID записей — те, на которые уже есть отзыв."""
    if not booking_ids:
        return set()
    result = await session.execute(
        select(Review.booking_id).where(Review.booking_id.in_(booking_ids))
    )
    return set(result.scalars().all())


# --- Пользователи бота (для рассылок) ---

async def register_bot_user(session: AsyncSession, user_id: int) -> None:
    stmt = sqlite_insert(BotUser).values(user_id=user_id).on_conflict_do_nothing()
    await session.execute(stmt)
    await session.commit()


async def get_all_bot_users(session: AsyncSession) -> list[BotUser]:
    result = await session.execute(select(BotUser))
    return list(result.scalars().all())


# --- Акции ---

async def create_promotion(
    session: AsyncSession,
    text: str,
    photo_file_id: str | None,
    end_date: datetime,
) -> Promotion:
    promo = Promotion(text=text, photo_file_id=photo_file_id, end_date=end_date)
    session.add(promo)
    await session.commit()
    await session.refresh(promo)
    return promo


async def get_active_promotions(session: AsyncSession) -> list[Promotion]:
    result = await session.execute(
        select(Promotion).where(
            Promotion.is_active == True,
            Promotion.end_date >= now(),
        ).order_by(Promotion.end_date)
    )
    return list(result.scalars().all())


async def get_all_promotions(session: AsyncSession) -> list[Promotion]:
    """Включая неактивные/просроченные — чтобы админ мог их отредактировать
    или удалить, а не только видеть то, что сейчас показывается клиентам."""
    result = await session.execute(
        select(Promotion).order_by(Promotion.created_at.desc())
    )
    return list(result.scalars().all())


async def update_promotion(
    session: AsyncSession,
    promo_id: int,
    text: str,
    end_date: datetime,
    photo_file_id: str | None = None,
    clear_photo: bool = False,
) -> Promotion | None:
    promo = await session.get(Promotion, promo_id)
    if promo is None:
        return None
    promo.text = text
    promo.end_date = end_date
    if clear_photo:
        promo.photo_file_id = None
    elif photo_file_id is not None:
        promo.photo_file_id = photo_file_id
    await session.commit()
    await session.refresh(promo)
    return promo


async def delete_promotion(session: AsyncSession, promo_id: int) -> bool:
    promo = await session.get(Promotion, promo_id)
    if promo is None:
        return False
    await session.delete(promo)
    await session.commit()
    return True


async def get_promos_for_reminder(session: AsyncSession) -> list[Promotion]:
    """Акции, которые заканчиваются через ≤ 2 дня, и напоминание ещё не отправлено."""
    current = now()
    deadline = current + timedelta(days=2)
    result = await session.execute(
        select(Promotion).where(
            Promotion.is_active == True,
            Promotion.reminder_sent == False,
            Promotion.end_date <= deadline,
            Promotion.end_date >= current,
        )
    )
    return list(result.scalars().all())


async def mark_promo_reminder_sent(session: AsyncSession, promo_id: int) -> None:
    await session.execute(
        update(Promotion).where(Promotion.id == promo_id).values(reminder_sent=True)
    )
    await session.commit()


async def get_bookings_for_reminder(session: AsyncSession) -> list[Booking]:
    """Активные записи, до начала которых осталось не больше ~25 ч., у которых
    ещё не отправлено напоминание и клиент ещё не подтвердил визит заранее
    через мини-апп. Анонимные записи (user_id=0, без Telegram-авторизации)
    исключены — слать напоминание некому, chat_id=0 не существует.

    Верхняя граница открыта, а не двусторонним окном 23–25ч: если планировщик
    не работал какое-то время (деплой, рестарт) и упустил момент для записи,
    напоминание всё равно уйдёт, как только процесс снова поднимется —
    вместо того чтобы навсегда потерять его, как только порог в 23ч останется
    позади (тот же принцип self-healing, что и у get_pending_review_requests)."""
    current = now()
    window_end = current + timedelta(hours=25)
    result = await session.execute(
        select(Booking)
        .options(selectinload(Booking.service), selectinload(Booking.slot))
        .join(TimeSlot, Booking.slot_id == TimeSlot.id)
        .where(
            Booking.status.in_(["pending", "confirmed"]),
            Booking.user_id != 0,
            Booking.reminder_sent == False,
            Booking.attendance_confirmed == False,
            TimeSlot.datetime > current,
            TimeSlot.datetime <= window_end,
        )
    )
    return list(result.scalars().all())


async def mark_attendance_confirmed(session: AsyncSession, booking_id: int) -> None:
    """Клиент заранее подтвердил визит через мини-апп — планировщик не должен
    слать отдельное 24ч-напоминание для этой записи."""
    await session.execute(
        update(Booking).where(Booking.id == booking_id).values(attendance_confirmed=True)
    )
    await session.commit()


async def mark_booking_reminder_sent(session: AsyncSession, booking_id: int) -> None:
    await session.execute(
        update(Booking).where(Booking.id == booking_id).values(reminder_sent=True)
    )
    await session.commit()


async def add_service(
    session: AsyncSession,
    name: str,
    description: str,
    duration_minutes: int,
    price: int,
) -> Service:
    service = Service(
        name=name,
        description=description,
        duration_minutes=duration_minutes,
        price=price,
    )
    session.add(service)
    await session.commit()
    await session.refresh(service)
    return service


async def update_service(
    session: AsyncSession,
    service_id: int,
    name: str,
    description: str,
    duration_minutes: int,
    price: int,
) -> Service | None:
    service = await session.get(Service, service_id)
    if service is None:
        return None
    service.name = name
    service.description = description
    service.duration_minutes = duration_minutes
    service.price = price
    await session.commit()
    await session.refresh(service)
    return service


async def delete_service(session: AsyncSession, service_id: int) -> str:
    """Возвращает 'deleted', 'not_found' или 'has_bookings'.

    В отличие от слотов (где блокирует только активная запись) — здесь
    запрещаем удаление, если есть ХОТЬ ОДНА запись (даже отменённая или
    старая): Booking.service_id — обычный внешний ключ без данных об
    услуге внутри самой записи, так что отображение истории записей
    (админ, "Мои записи") сломалось бы при обращении к b.service."""
    service = await session.get(Service, service_id)
    if service is None:
        return "not_found"
    count_result = await session.execute(
        select(func.count()).select_from(Booking).where(Booking.service_id == service_id)
    )
    if count_result.scalar_one() > 0:
        return "has_bookings"
    await session.delete(service)
    await session.commit()
    return "deleted"
