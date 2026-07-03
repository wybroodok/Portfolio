import asyncio
import logging

from aiogram import Bot

from database.db import async_session
from database.requests import (
    get_all_bot_users,
    get_bookings_for_reminder,
    get_pending_review_requests,
    get_promos_for_reminder,
    get_reviewed_booking_ids,
    mark_booking_reminder_sent,
    mark_promo_reminder_sent,
    mark_review_sent,
)
from keyboards.inline import open_app_kb

CHECK_INTERVAL = 60  # секунд между проверками


async def scheduler(bot: Bot) -> None:
    """Фоновая задача: каждую минуту обрабатывает отзывы, напоминания и акции."""
    while True:
        await asyncio.sleep(CHECK_INTERVAL)
        await _process_review_requests(bot)
        await _process_booking_reminders(bot)
        await _process_promo_reminders(bot)


async def _process_review_requests(bot: Bot) -> None:
    try:
        async with async_session() as session:
            pending = await get_pending_review_requests(session)
            # Клиент мог уже оставить отзыв через мини-апп между тем, как это
            # запрос стал "due", и текущим тиком планировщика — не шлём
            # повторную просьбу оценить визит, если отзыв уже есть.
            reviewed_ids = await get_reviewed_booking_ids(session, [req.booking_id for req in pending])
            # Помечаем ВСЕ как sent до отправки (исключает дубли при рестарте) —
            # включая уже отозванные, иначе они будут вечно попадать в выборку
            # get_pending_review_requests на каждом тике планировщика.
            for req in pending:
                await mark_review_sent(session, req.id)
            pending = [req for req in pending if req.booking_id not in reviewed_ids]

        for req in pending:
            try:
                await bot.send_message(
                    req.user_id,
                    f"✨ Как вам прошедшая процедура <b>{req.service_name}</b>?\n\n"
                    "Оцените визит в приложении — это займёт полминуты:",
                    reply_markup=open_app_kb("/my-bookings"),
                )
            except Exception as e:
                logging.warning("Не удалось отправить запрос отзыва user_id=%s: %s", req.user_id, e)

    except Exception as e:
        logging.error("Ошибка обработки отзывов: %s", e)


async def _process_booking_reminders(bot: Bot) -> None:
    """Напоминание клиенту за ~24 часа до записи. Подтвердить визит или
    отменить запись можно в мини-аппе (раздел "Мои записи")."""
    try:
        async with async_session() as session:
            bookings = await get_bookings_for_reminder(session)
            for b in bookings:
                await mark_booking_reminder_sent(session, b.id)

        for b in bookings:
            try:
                slot_str = b.slot.datetime.strftime("%d.%m.%Y %H:%M")
                await bot.send_message(
                    b.user_id,
                    f"⏰ <b>Напоминание о записи</b>\n\n"
                    f"Завтра у вас:\n"
                    f"📅 {slot_str}\n"
                    f"💆 {b.service.name}\n"
                    f"💰 {b.service.price} ₽\n\n"
                    "Подтвердить визит или отменить запись — в приложении:",
                    reply_markup=open_app_kb("/my-bookings"),
                )
            except Exception as e:
                logging.warning("Не удалось отправить напоминание user_id=%s: %s", b.user_id, e)

    except Exception as e:
        logging.error("Ошибка обработки напоминаний о записях: %s", e)


async def _process_promo_reminders(bot: Bot) -> None:
    try:
        async with async_session() as session:
            promos = await get_promos_for_reminder(session)
            for promo in promos:
                await mark_promo_reminder_sent(session, promo.id)
            users = await get_all_bot_users(session) if promos else []

        for promo in promos:
            reminder_header = f"⏰ <b>Акция заканчивается через 2 дня!</b> (до {promo.end_date.strftime('%d.%m.%Y')})\n\n"
            for user in users:
                try:
                    if promo.photo_file_id:
                        caption = reminder_header + promo.text if promo.text else reminder_header.strip()
                        await bot.send_photo(user.user_id, promo.photo_file_id, caption=caption)
                    else:
                        await bot.send_message(user.user_id, reminder_header + promo.text)
                except Exception:
                    pass

    except Exception as e:
        logging.error("Ошибка обработки напоминаний об акциях: %s", e)
