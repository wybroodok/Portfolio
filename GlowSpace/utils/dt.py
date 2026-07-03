from datetime import datetime
from zoneinfo import ZoneInfo

from config import TIMEZONE


def now() -> datetime:
    """Текущее время в настроенном часовом поясе (naive datetime для сравнения с БД)."""
    return datetime.now(ZoneInfo(TIMEZONE)).replace(tzinfo=None)
