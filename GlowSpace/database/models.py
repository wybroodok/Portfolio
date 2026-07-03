from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Service(Base):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(String(500), default="")
    duration_minutes: Mapped[int] = mapped_column(Integer)
    price: Mapped[int] = mapped_column(Integer)  # in rubles

    bookings: Mapped[list["Booking"]] = relationship(back_populates="service")


class TimeSlot(Base):
    __tablename__ = "time_slots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    datetime: Mapped[datetime] = mapped_column(DateTime)
    is_available: Mapped[bool] = mapped_column(default=True)

    bookings: Mapped[list["Booking"]] = relationship(back_populates="slot")


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(BigInteger)
    user_name: Mapped[str] = mapped_column(String(100))
    phone: Mapped[str] = mapped_column(String(20))
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id"))
    slot_id: Mapped[int] = mapped_column(ForeignKey("time_slots.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending / confirmed / cancelled
    reminder_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    # Клиент подтвердил визит через мини-апп (кнопка "Да, приду") — отдельно от
    # reminder_sent, который значит "24ч-напоминание отправлено планировщиком".
    # Раньше эти два события ошибочно делили один флаг.
    attendance_confirmed: Mapped[bool] = mapped_column(Boolean, default=False)

    service: Mapped["Service"] = relationship(back_populates="bookings")
    slot: Mapped["TimeSlot"] = relationship(back_populates="bookings")


class ReviewRequest(Base):
    """Запланированный запрос отзыва — отправляется боком после окончания процедуры."""
    __tablename__ = "review_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    booking_id: Mapped[int] = mapped_column(ForeignKey("bookings.id"), unique=True)
    user_id: Mapped[int] = mapped_column(BigInteger)
    service_name: Mapped[str] = mapped_column(String(100))
    scheduled_at: Mapped[datetime] = mapped_column(DateTime)
    sent: Mapped[bool] = mapped_column(Boolean, default=False)


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    booking_id: Mapped[int] = mapped_column(ForeignKey("bookings.id"), unique=True)
    user_id: Mapped[int] = mapped_column(BigInteger)
    user_name: Mapped[str] = mapped_column(String(100), default="")
    rating: Mapped[int] = mapped_column(Integer)  # 1–5
    comment: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class BotUser(Base):
    """Все пользователи, которые хоть раз запустили бота — для рассылок."""
    __tablename__ = "bot_users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(BigInteger, unique=True)
    registered_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Promotion(Base):
    __tablename__ = "promotions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    text: Mapped[str] = mapped_column(String(1000))
    photo_file_id: Mapped[str | None] = mapped_column(String(200), nullable=True)
    end_date: Mapped[datetime] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    reminder_sent: Mapped[bool] = mapped_column(Boolean, default=False)  # напоминание за 2 дня
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class BookingLog(Base):
    """Аудит-лог всех действий с бронированиями."""
    __tablename__ = "booking_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    booking_id: Mapped[int] = mapped_column(Integer, index=True)
    # created / confirmed / cancelled_client / cancelled_admin / cancelled_day_block
    action: Mapped[str] = mapped_column(String(50))
    actor_id: Mapped[int] = mapped_column(BigInteger)
    actor_name: Mapped[str] = mapped_column(String(100), default="")
    service_name: Mapped[str] = mapped_column(String(100), default="")
    slot_dt: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    note: Mapped[str] = mapped_column(String(200), default="")
    timestamp: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
