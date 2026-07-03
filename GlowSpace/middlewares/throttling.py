from typing import Any, Awaitable, Callable

from aiogram import BaseMiddleware
from aiogram.types import Message
from cachetools import TTLCache

THROTTLE_RATE = 1  # секунд между сообщениями от одного пользователя
_cache: TTLCache = TTLCache(maxsize=10_000, ttl=THROTTLE_RATE)


class ThrottlingMiddleware(BaseMiddleware):
    async def __call__(
        self,
        handler: Callable[[Message, dict[str, Any]], Awaitable[Any]],
        event: Message,
        data: dict[str, Any],
    ) -> Any:
        user_id = event.from_user.id if event.from_user else None
        if user_id and user_id in _cache:
            return
        if user_id:
            _cache[user_id] = True
        return await handler(event, data)
