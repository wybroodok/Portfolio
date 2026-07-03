from aiogram import Router
from aiogram.filters import CommandStart
from aiogram.types import Message, ReplyKeyboardRemove

from database.db import async_session
from database.requests import register_bot_user

router = Router()


@router.message(CommandStart())
async def cmd_start(message: Message) -> None:
    async with async_session() as session:
        await register_bot_user(session, message.from_user.id)

    # Кнопки запуска мини-аппа своей (reply-keyboard web_app) больше нет —
    # на практике она давала менее надёжную Telegram-авторизацию, чем Menu
    # Button, настроенная через @BotFather. Она теперь единственная точка
    # входа. Telegram хранит показанную reply-клавиатуру у пользователя,
    # пока бот явно не пришлёт её снятие — просто перестать её отправлять
    # недостаточно, у тех, кто уже видел /start, старая кнопка останется
    # висеть до этого сообщения.
    await message.answer(
        "Добро пожаловать! Запись на услуги, ваши записи, отзывы и акции — "
        "всё в мини-приложении. 💅",
        reply_markup=ReplyKeyboardRemove(),
    )
