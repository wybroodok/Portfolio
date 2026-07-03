import { Gift } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '../api'
import ErrorState from '../components/ErrorState'
import PageHeader from '../components/PageHeader'
import PromoPhoto from '../components/PromoPhoto'
import Spinner from '../components/Spinner'
import { type Promotion } from '../mockData'

export default function Promotions() {
  // Раздел есть и в нижнем меню — стрелка "назад" только если пришли с
  // главного экрана, а не по вкладке снизу.
  const cameFromHome = useLocation().state?.from === 'home'
  const [promos, setPromos] = useState<(Promotion & { hasPhoto: boolean })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    setLoading(true)
    setError('')
    api.get<any[]>('/api/promotions')
      .then(data => setPromos(data.map(p => ({
        id: p.id,
        text: p.text,
        endDate: p.end_date,
        hasPhoto: p.has_photo,
      }))))
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false))
  }, [retry])

  return (
    <div className="page-enter flex flex-col min-h-[100dvh] pb-24">
      <PageHeader title="Акции" back={cameFromHome ? '/' : undefined} />

      <div className="flex-1 px-4 pt-4">
        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorState message={error} onRetry={() => setRetry(n => n + 1)} />
        ) : promos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent-soft flex items-center justify-center mb-4">
              <Gift size={32} strokeWidth={2} className="text-accent" />
            </div>
            <p className="text-primary font-medium">Пока нет активных акций</p>
            <p className="text-hint text-sm mt-1">Следите за обновлениями!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {promos.map(promo => {
              const endDate = new Date(promo.endDate).toLocaleDateString('ru-RU', {
                day: '2-digit', month: '2-digit', year: 'numeric',
              })
              return (
                <div key={promo.id} className="bg-card rounded-2xl overflow-hidden border border-tgline">
                  {promo.hasPhoto && <PromoPhoto promoId={promo.id} alt={promo.text || 'Фото акции'} />}
                  <div className="p-4">
                    {promo.text && <p className="text-primary text-sm leading-relaxed">{promo.text}</p>}
                    <p className="text-xs text-hint mt-2">До {endDate}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
