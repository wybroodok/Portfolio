import asyncio
import logging

import uvicorn
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.fsm.storage.memory import MemoryStorage

from api.app import app as fastapi_app
from config import API_PORT, BOT_TOKEN
from database.db import init_db
from handlers import start
from middlewares.throttling import ThrottlingMiddleware
from scheduler import scheduler

logging.basicConfig(level=logging.INFO)


async def run_api() -> None:
    config = uvicorn.Config(fastapi_app, host="0.0.0.0", port=API_PORT, log_level="warning")
    server = uvicorn.Server(config)
    await server.serve()


async def main() -> None:
    bot = Bot(token=BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    dp = Dispatcher(storage=MemoryStorage())

    # Даёт FastAPI-приложению доступ к боту для рассылок из веб-админки
    # (публикация акций, уведомления при блокировке дня).
    fastapi_app.state.bot = bot

    dp.message.middleware(ThrottlingMiddleware())

    dp.include_router(start.router)

    await init_db()

    # Запускаем бот, API сервер и планировщик конкурентно
    await asyncio.gather(
        dp.start_polling(bot),
        run_api(),
        scheduler(bot),
    )


if __name__ == "__main__":
    asyncio.run(main())
