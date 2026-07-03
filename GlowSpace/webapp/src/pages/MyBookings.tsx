import { Calendar1, CheckCircle2, ClipboardList, Star, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api'
import ErrorState from '../components/ErrorState'
import PageHeader from '../components/PageHeader'
import Spinner from '../components/Spinner'
import { type Booking } from '../mockData'

function formatDT(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const STATUS_MAP = {
  pending:   { label: 'Ожидает',      color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400'      },
  confirmed: { label: 'Подтверждено', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' },
  cancelled: { label: 'Отменено',     color: 'text-gray-400 bg-gray-100 dark:bg-gray-700'      },
}

function getStoredIds(): number[] {
  try { return JSON.parse(localStorage.getItem('bookingIds') || '[]') } catch { return [] }
}

function removeStoredId(id: number) {
  try {
    const ids = getStoredIds().filter(i => i !== id)
    localStorage.setItem('bookingIds', JSON.stringify(ids))
  } catch {}
}

// Бэкенд отдаёт эти поля в snake_case — тот же паттерн доступа через `as any`,
// что уже используется в admin/AllBookings.tsx для user_name.
function isPast(b: Booking) { return Boolean((b as any).is_past) }
function hasReview(b: Booking) { return Boolean((b as any).has_review) }
function needsAttendanceConfirm(b: Booking) { return Boolean((b as any).needs_attendance_confirm) }

function ReviewForm({ bookingId, onDone }: { bookingId: number; onDone: () => void }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!rating) return
    setSubmitting(true)
    setError('')
    try {
      await api.post('/api/reviews', { booking_id: bookingId, rating, comment: comment.trim() || null })
      onDone()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-tgline">
      <p className="text-xs text-hint mb-2">Оцените визит:</p>
      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={() => setRating(n)}
            className="active:scale-90 transition-transform duration-200"
            style={{ transitionTimingFunction: 'var(--ease-spring)' }}
          >
            <Star
              size={28}
              className={n <= rating ? 'fill-accent text-accent' : 'fill-none text-tgline'}
              strokeWidth={1.8}
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Комментарий (необязательно)"
        rows={2}
        className="w-full bg-app border border-tgline rounded-xl px-3 py-2 text-sm text-primary placeholder-hint focus:outline-none focus:ring-2 focus:ring-accent resize-none mb-2"
      />
      {error && <p className="text-red-500 dark:text-red-400 text-xs mb-2">{error}</p>}
      <button
        onClick={submit}
        disabled={!rating || submitting}
        className="w-full py-2 bg-accent text-white rounded-xl text-sm font-medium disabled:opacity-40"
      >
        {submitting ? 'Отправляем...' : 'Отправить отзыв'}
      </button>
    </div>
  )
}

export default function MyBookings() {
  const navigate = useNavigate()
  // Раздел есть и в нижнем меню — стрелка "назад" только если пришли с
  // главного экрана, а не по вкладке снизу.
  const cameFromHome = useLocation().state?.from === 'home'
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [reviewingId, setReviewingId] = useState<number | null>(null)
  const [confirmingId, setConfirmingId] = useState<number | null>(null)

  useEffect(() => {
    let ignore = false
    async function load() {
      // 1. Пробуем Telegram-авторизацию (работает на мобильном/Desktop)
      try {
        const data = await api.get<Booking[]>('/api/bookings/me')
        if (!ignore) setBookings(data)
        return
      } catch (e: any) {
        if (!e.message.startsWith('401')) {
          if (!ignore) setError(e.message)
          return
        }
      }

      // 2. Fallback: localStorage (работает везде, включая Telegram Web)
      const ids = getStoredIds()
      if (ids.length === 0) {
        if (!ignore) setBookings([])
        return
      }
      try {
        const data = await api.get<Booking[]>(`/api/bookings/by-ids?ids=${ids.join(',')}`)
        // Показываем только активные; убираем из localStorage отменённые
        const active = data.filter(b => b.status !== 'cancelled')
        const cancelled = data.filter(b => b.status === 'cancelled')
        cancelled.forEach(b => removeStoredId(b.id))
        if (!ignore) setBookings(active)
      } catch (e: any) {
        if (!ignore) setError(e.message)
      }
    }

    setLoading(true)
    setError('')
    load().finally(() => { if (!ignore) setLoading(false) })
    return () => { ignore = true }
  }, [retry])

  const cancelBooking = async (id: number) => {
    setCancelling(id)
    try {
      await api.delete(`/api/bookings/${id}`)
      removeStoredId(id)
      setBookings(prev => prev.filter(b => b.id !== id))
    } catch (e: any) {
      alert(e.message)
    } finally {
      setCancelling(null)
    }
  }

  const confirmAttendance = async (id: number) => {
    setConfirmingId(id)
    try {
      await api.post(`/api/bookings/${id}/confirm-attendance`, {})
      setBookings(prev => prev.map(b => b.id === id ? ({ ...b, needs_attendance_confirm: false } as any) : b))
    } catch (e: any) {
      alert(e.message)
    } finally {
      setConfirmingId(null)
    }
  }

  return (
    <div className="page-enter flex flex-col min-h-[100dvh] pb-24">
      <PageHeader title="Мои записи" back={cameFromHome ? '/' : undefined} />

      <div className="flex-1 px-4 pt-4">
        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorState message={error} onRetry={() => setRetry(n => n + 1)} />
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent-soft flex items-center justify-center mb-4">
              <ClipboardList size={32} strokeWidth={2} className="text-accent" />
            </div>
            <p className="text-primary font-medium">Нет активных записей</p>
            <p className="text-hint text-sm mt-1">Запишитесь на процедуру</p>
            <button
              onClick={() => navigate('/booking')}
              className="mt-6 px-6 py-3 bg-accent text-white rounded-full font-semibold text-sm"
            >
              Записаться
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {bookings.map(b => {
              const st = STATUS_MAP[b.status]
              const past = isPast(b)
              const reviewed = hasReview(b)
              const attendanceDue = needsAttendanceConfirm(b) && !past
              // Кнопка отмены скрыта только для прошедших подтверждённых визитов
              // (для них ниже показывается форма отзыва) — просроченная неподтверждённая
              // запись всё ещё должна оставаться отменяемой.
              const showCancel = !past || b.status !== 'confirmed'
              return (
                <div key={b.id} className="bg-card rounded-2xl p-4 border border-tgline">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-primary">{b.service.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>
                      {st.label}
                    </span>
                  </div>
                  <p className="text-sm text-hint mb-1 flex items-center gap-1.5">
                    <Calendar1 size={15} className="shrink-0" /> {formatDT(b.slot.datetime)}
                  </p>
                  <p className="text-sm text-hint mb-3 flex items-center gap-1.5">
                    <Wallet size={15} className="shrink-0" /> {b.service.price} ₽
                  </p>

                  {attendanceDue && (
                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={() => confirmAttendance(b.id)}
                        disabled={confirmingId === b.id}
                        className="flex-1 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 size={16} /> Да, приду
                      </button>
                    </div>
                  )}

                  {showCancel && (
                    <button
                      onClick={() => cancelBooking(b.id)}
                      disabled={cancelling === b.id}
                      className="w-full py-2 border border-red-200 dark:border-red-800 text-red-400 rounded-xl text-sm font-medium active:scale-[0.98] transition-transform disabled:opacity-50"
                    >
                      {cancelling === b.id ? 'Отмена...' : 'Отменить запись'}
                    </button>
                  )}

                  {past && b.status === 'confirmed' && (
                    reviewed ? (
                      <p className="text-xs text-hint text-center flex items-center justify-center gap-1.5">
                        <CheckCircle2 size={14} /> Спасибо за отзыв!
                      </p>
                    ) : reviewingId === b.id ? (
                      <ReviewForm
                        bookingId={b.id}
                        onDone={() => {
                          setBookings(prev => prev.map(x => x.id === b.id ? ({ ...x, has_review: true } as any) : x))
                          setReviewingId(null)
                        }}
                      />
                    ) : (
                      <button
                        onClick={() => setReviewingId(b.id)}
                        className="w-full py-2 border border-tgline text-accent rounded-xl text-sm font-medium flex items-center justify-center gap-1.5"
                      >
                        <Star size={16} /> Оставить отзыв
                      </button>
                    )
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
