from aiogram.types import InlineKeyboardMarkup, WebAppInfo
from aiogram.utils.keyboard import InlineKeyboardBuilder

from config import WEBAPP_URL


def open_app_kb(path: str = "") -> InlineKeyboardMarkup | None:
    """Инлайн-кнопка открытия мини-аппа, прикрепляемая к push-уведомлениям
    (напоминание, запрос отзыва, новая запись у админа). Все действия — в
    мини-аппе, здесь только вход.

    path — необязательный маршрут внутри приложения (например "/my-bookings"),
    на который сразу попадёт пользователь. Возвращает None, если WEBAPP_URL
    не задан (тогда сообщение уходит вообще без кнопки)."""
    if not WEBAPP_URL:
        return None
    builder = InlineKeyboardBuilder()
    builder.button(text="🌸 Открыть приложение", web_app=WebAppInfo(url=f"{WEBAPP_URL}{path}"))
    return builder.as_markup()
