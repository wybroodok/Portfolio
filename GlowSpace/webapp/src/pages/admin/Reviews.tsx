import { FileDown, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../../api'
import ErrorState from '../../components/ErrorState'
import PageHeader from '../../components/PageHeader'
import Spinner from '../../components/Spinner'
import { type Review } from '../../mockData'

function Stars({ n }: { n: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={14} className={i < n ? 'fill-amber-400 text-amber-400' : 'fill-none text-tgline'} />
      ))}
    </span>
  )
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    setLoading(true)
    setError('')
    api.get<any[]>('/api/admin/reviews')
      .then(data => setReviews(data.map(r => ({
        id: r.id,
        userName: r.user_name,
        serviceName: '',
        rating: r.rating,
        comment: r.comment ?? '',
        date: r.created_at.slice(0, 10),
      }))))
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false))
  }, [retry])

  const avg = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await api.downloadBlob('/api/admin/reviews/export')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'reviews.csv'
      // Некоторые встроенные WebView (в т.ч. в Telegram на iOS) молча
      // игнорируют клик по элементу, не добавленному в DOM.
      document.body.appendChild(a)
      a.click()
      a.remove()
      // Ревокуем на следующий тик — если сделать это сразу, скачивание
      // в некоторых браузерах не успевает начаться до отзыва URL.
      setTimeout(() => URL.revokeObjectURL(url), 0)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="page-enter flex flex-col min-h-[100dvh] pb-6">
      <PageHeader title="Отзывы" back="/admin" />

      {!loading && !error && reviews.length > 0 && (
        <div className="px-4 pt-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full py-2.5 border border-tgline text-accent rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {exporting ? 'Экспортируем...' : <><FileDown size={16} /> Экспорт в CSV</>}
          </button>
        </div>
      )}

      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorState message={error} onRetry={() => setRetry(n => n + 1)} />
        ) : reviews.length === 0 ? (
          <div className="text-center py-20 text-hint">Отзывов пока нет</div>
        ) : (
          <>
            <div className="bg-accent rounded-2xl p-4 text-white text-center">
              <div className="text-3xl font-bold">{avg.toFixed(1)}</div>
              <Stars n={Math.round(avg)} />
              <div className="text-xs text-white/80 mt-1">{reviews.length} отзывов</div>
            </div>
            {reviews.map(r => (
              <div key={r.id} className="bg-card rounded-2xl p-4 border border-tgline">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-primary text-sm">{r.userName}</span>
                  <Stars n={r.rating} />
                </div>
                <p className="text-xs text-hint mb-2">{r.date}</p>
                {r.comment && <p className="text-sm text-primary/80 leading-relaxed">"{r.comment}"</p>}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
