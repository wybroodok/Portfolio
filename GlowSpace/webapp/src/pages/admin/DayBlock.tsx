import { AlertTriangle, CheckCircle2, Moon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api'
import PageHeader from '../../components/PageHeader'

export default function DayBlock() {
  const navigate = useNavigate()
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [cancelledCount, setCancelledCount] = useState(0)
  const [notifiedCount, setNotifiedCount] = useState(0)
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    setSubmitting(true)
    setError('')
    try {
      const res = await api.post<{ cancelled_count: number; notified_count: number }>(
        '/api/admin/day-block', {},
      )
      setCancelledCount(res.cancelled_count)
      setNotifiedCount(res.notified_count)
      setDone(true)
      setTimeout(() => navigate('/admin'), 2000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="page-enter flex flex-col items-center justify-center min-h-[100dvh] text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-accent-soft flex items-center justify-center mb-3">
          <CheckCircle2 size={32} strokeWidth={1.8} className="text-accent" />
        </div>
        <p className="font-semibold text-primary">День заблокирован</p>
        <p className="text-xs text-hint mt-1">
          {cancelledCount > 0
            ? `Отменено записей: ${cancelledCount}. Уведомлено клиентов: ${notifiedCount}`
            : 'Записей на сегодня не было'}
        </p>
      </div>
    )
  }

  return (
    <div className="page-enter flex flex-col min-h-[100dvh] pb-6">
      <PageHeader title="Блокировка дня" back="/admin" />

      <div className="flex-1 px-4 pt-6 flex flex-col gap-4">
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-2xl p-4">
          <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1.5">
            <AlertTriangle size={16} /> Форс-мажор
          </p>
          <p className="text-sm text-amber-600 dark:text-amber-400 leading-relaxed">
            Эта функция отменит все записи на сегодня и запретит новые.
            Клиенты получат уведомление об отмене.
          </p>
        </div>

        {error && <p className="text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-2">{error}</p>}

        {!confirmed ? (
          <button
            onClick={() => setConfirmed(true)}
            className="w-full py-3.5 bg-red-500 text-white rounded-full font-semibold flex items-center justify-center gap-2"
          >
            <Moon size={18} /> Я сегодня занят
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-center text-sm text-primary font-medium">Вы уверены?</p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="flex-1 py-3 bg-red-500 text-white rounded-full font-semibold disabled:opacity-60"
              >
                {submitting ? 'Блокируем...' : 'Да, заблокировать'}
              </button>
              <button
                onClick={() => setConfirmed(false)}
                disabled={submitting}
                className="flex-1 py-3 border border-tgline text-hint rounded-full"
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
