from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from database.models import Base

engine = create_async_engine("sqlite+aiosqlite:///cosapp.db")
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        for migration in [
            "ALTER TABLE reviews ADD COLUMN user_name VARCHAR(100) NOT NULL DEFAULT ''",
            "ALTER TABLE bookings ADD COLUMN reminder_sent BOOLEAN NOT NULL DEFAULT 0",
            "ALTER TABLE bookings ADD COLUMN attendance_confirmed BOOLEAN NOT NULL DEFAULT 0",
        ]:
            try:
                await conn.execute(text(migration))
            except Exception:
                pass  # столбец уже существует
