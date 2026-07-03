import { Calendar1, CheckCircle2, Phone, Trash2, User, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../../api'
import ErrorState from '../../components/ErrorState'
import PageHeader from '../../components/PageHeader'
import Spinner from '../../components/Spinner'
import { type Booking } from '../../mockData'

function formatDT(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const STATUS_MAP = {
  pending:   { label: 'Ожидает',      color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400'     },
  confirmed: { label: 'Подтверждено', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' },
  cancelled: { label: 'Отменено',     color: 'text-gray-400 bg-gray-100 dark:bg-gray-700'      },
}

export default function AllBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    setLoading(true)
    setError('')
    api.get<any[]>('/api/admin/bookings')
      .then(data => setBookings(data.map(b => ({
        id: b.id,
        service: b.service,
        slot: b.slot,
        status: b.status,
        userName: b.user_name,
        phone: b.phone,
        createdAt: b.created_at,
      }))))
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false))
  }, [retry])

  const confirmBooking = async (id: number) => {
    setActing(id)
    try {
      await api.post(`/api/admin/bookings/${id}/confirm`, {})
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'confirmed' as const } : b))
    } catch (e: any) {
      alert(e.message)
      // Состояние на сервере могло уже измениться (гонка с клиентом/другим
      // админом) — перезапрашиваем список, а не оставляем устаревший статус.
      setRetry(n => n + 1)
    }
    finally { setActing(null) }
  }

  const cancelBooking = async (id: number) => {
    setActing(id)
    try {
      await api.post(`/api/admin/bookings/${id}/cancel`, {})
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' as const } : b))
    } catch (e: any) {
      alert(e.message)
      setRetry(n => n + 1)
    }
    finally { setActing(null) }
  }

  // В отличие от cancelBooking — не меняет статус, а безвозвратно убирает
  // запись из списка (для очистки старых отменённых записей).
  const deleteBooking = async (id: number) => {
    if (!confirm('Удалить запись безвозвратно? Это действие нельзя отменить.')) return
    setActing(id)
    try {
      await api.delete(`/api/admin/bookings/${id}`)
      setBookings(prev => prev.filter(b => b.id !== id))
    } catch (e: any) {
      alert(e.message)
      setRetry(n => n + 1)
    }
    finally { setActing(null) }
  }

  return (
    <div className="page-enter flex flex-col min-h-[100dvh] pb-6">
      <PageHeader title="Все записи" back="/admin" />

      <div className="flex-1 px-4 pt-4 flex flex-col gap-3">
        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorState message={error} onRetry={() => setRetry(n => n + 1)} />
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 text-hint">Записей нет</div>
        ) : bookings.map(b => {
          const st = STATUS_MAP[b.status]
          const isActive = b.status !== 'cancelled'
          const busy = acting === b.id
          return (
            <div key={b.id} className="bg-card rounded-2xl p-4 border border-tgline">
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-primary text-sm">#{b.id} {b.service.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
              </div>
              <p className="text-xs text-hint flex items-center gap-1.5"><Calendar1 size={13} /> {formatDT(b.slot.datetime)}</p>
              <p className="text-xs text-hint flex items-center gap-1.5"><User size={13} /> {b.userName}</p>
              <p className="text-xs text-hint mb-3 flex items-center gap-1.5"><Phone size={13} /> {b.phone}</p>
              <div className="flex gap-2">
                {isActive && b.status === 'pending' && (
                  <button
                    onClick={() => confirmBooking(b.id)}
                    disabled={busy}
                    className="flex-1 py-2 bg-emerald-500 text-white rounded-xl text-xs font-medium disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 size={14} /> Подтвердить
                  </button>
                )}
                {isActive && (
                  <button
                    onClick={() => cancelBooking(b.id)}
                    disabled={busy}
                    className="flex-1 py-2 border border-red-200 dark:border-red-800 text-red-400 rounded-xl text-xs font-medium disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <X size={14} /> Отменить
                  </button>
                )}
                <button
                  onClick={() => deleteBooking(b.id)}
                  disabled={busy}
                  aria-label="Удалить запись"
                  className={`${isActive ? '' : 'flex-1'} px-3 py-2 border border-tgline text-hint rounded-xl text-xs font-medium disabled:opacity-50 flex items-center justify-center gap-1.5`}
                >
                  <Trash2 size={14} /> {!isActive && 'Удалить'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
