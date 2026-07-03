import { CheckCircle2, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api'
import Calendar from '../components/Calendar'
import ErrorState from '../components/ErrorState'
import PageHeader from '../components/PageHeader'
import Spinner from '../components/Spinner'
import { type Service, type TimeSlot } from '../mockData'

type Step = 'service' | 'slot' | 'name' | 'phone' | 'confirm' | 'done'

interface BookingData {
  service?: Service
  slot?: TimeSlot
  name: string
  phone: string
}

const STEPS: Step[] = ['service', 'slot', 'name', 'phone', 'confirm']
const STEP_LABELS = ['Услуга', 'Дата/время', 'Имя', 'Телефон', 'Подтверждение']

function formatDT(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// Не проверяем, что номер реально существует — только что он похож на
// российский мобильный: раньше проверялось лишь количество цифр (10-15),
// под это подходил вообще любой набор цифр произвольной страны/формата.
// Теперь: после нормализации (ведущая 8 — обычная запись +7 в России —
// заменяется на 7) должно получиться РОВНО 11 цифр, начинающихся на 7.
function isValidPhone(phone: string): boolean {
  const trimmed = phone.trim()
  if (!/^\+?[\d\s\-()]+$/.test(trimmed)) return false
  let digits = trimmed.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('8')) digits = '7' + digits.slice(1)
  return digits.length === 11 && digits.startsWith('7')
}

export default function Booking() {
  const navigate = useNavigate()
  // Этот раздел есть и в нижнем меню — стрелка "назад" на первом шаге нужна
  // только если сюда пришли с главного экрана (через карточку), а не по
  // вкладке снизу (там переход между разделами и так возможен одним тапом).
  const cameFromHome = useLocation().state?.from === 'home'
  const [step, setStep] = useState<Step>('service')
  const [data, setData] = useState<BookingData>({ name: '', phone: '' })

  // Услуги
  const [services, setServices] = useState<Service[]>([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [servicesError, setServicesError] = useState('')
  const [servicesRetry, setServicesRetry] = useState(0)

  // Слоты для выбранной даты
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotsError, setSlotsError] = useState('')

  useEffect(() => {
    setLoadingServices(true)
    setServicesError('')
    api.get<Service[]>('/api/services')
      .then(setServices)
      .catch((e: any) => setServicesError(e.message))
      .finally(() => setLoadingServices(false))
  }, [servicesRetry])

  // Когда пользователь выбрал дату — грузим слоты
  useEffect(() => {
    if (!selectedDate) return
    let ignore = false
    setLoadingSlots(true)
    setSlots([])
    setSlotsError('')
    api.get<TimeSlot[]>(`/api/slots?date=${selectedDate}`)
      .then(data => { if (!ignore) setSlots(data) })
      .catch((e: any) => { if (!ignore) setSlotsError(e.message) })
      .finally(() => { if (!ignore) setLoadingSlots(false) })
    // Если пользователь успел переключить дату до ответа — игнорируем устаревший
    // результат, иначе более медленный ответ на СТАРУЮ дату может перезаписать
    // уже отрисованные слоты для новой.
    return () => { ignore = true }
  }, [selectedDate])

  const stepIndex = STEPS.indexOf(step)

  const goBack = () => {
    if (step === 'slot') { setSelectedDate(''); setStep('service'); return }
    if (stepIndex === 0) navigate('/')
    else setStep(STEPS[stepIndex - 1])
  }
  // На первом шаге стрелка есть только если пришли с главного меню; на
  // остальных шагах она всегда нужна — это уже шаг назад внутри мастера
  // записи, а не выход из раздела.
  const headerBack = stepIndex === 0 ? (cameFromHome ? goBack : undefined) : goBack

  if (step === 'done') {
    return (
      <div className="page-enter flex flex-col items-center justify-center min-h-[100dvh] px-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-accent-soft flex items-center justify-center mb-4">
          <CheckCircle2 size={44} strokeWidth={1.8} className="text-accent" />
        </div>
        <h2 className="text-xl font-bold text-primary mb-2">Запись оформлена!</h2>
        <p className="text-hint text-sm mb-1">Услуга: {data.service?.name}</p>
        <p className="text-hint text-sm mb-1">
          Дата: {data.slot ? formatDT(data.slot.datetime) : ''}
        </p>
        <p className="text-hint text-xs mt-3">Мы свяжемся с вами для подтверждения</p>
        <button
          onClick={() => navigate('/')}
          className="mt-8 px-8 py-3 bg-accent text-white rounded-full font-semibold"
        >
          На главную
        </button>
      </div>
    )
  }

  return (
    <div className="page-enter flex flex-col min-h-[100dvh] pb-6">
      <PageHeader title="Запись на услугу" back={headerBack} />

      {/* Progress bar */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= stepIndex ? 'bg-accent' : 'bg-tgline'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-hint mt-1.5">{STEP_LABELS[stepIndex]}</p>
      </div>

      <div className="flex-1 px-4 pt-2">

        {/* Step 1 — pick service */}
        {step === 'service' && (
          <div className="flex flex-col gap-3">
            {loadingServices ? (
              <Spinner compact />
            ) : servicesError ? (
              <ErrorState compact message={servicesError} onRetry={() => setServicesRetry(n => n + 1)} />
            ) : services.length === 0 ? (
              <div className="text-center py-16 text-hint text-sm">
                Пока нет доступных услуг.<br />Загляните позже.
              </div>
            ) : services.map(svc => (
              <button
                key={svc.id}
                onClick={() => { setData(d => ({ ...d, service: svc })); setStep('slot') }}
                className="bg-card rounded-2xl p-4 text-left border border-tgline active:scale-[0.98] transition-transform"
              >
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-primary">{svc.name}</span>
                  <span className="text-accent font-bold text-sm">{svc.price} ₽</span>
                </div>
                <p className="text-xs text-hint mt-1">{svc.description}</p>
                <p className="text-xs text-hint mt-0.5">{svc.duration} мин</p>
              </button>
            ))}
          </div>
        )}

        {/* Step 2a — pick date */}
        {step === 'slot' && !selectedDate && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-hint">
              Услуга: <span className="font-medium text-primary">{data.service?.name}</span>
            </p>
            <Calendar value={selectedDate} onSelect={setSelectedDate} />
          </div>
        )}

        {/* Step 2b — pick time slot */}
        {step === 'slot' && selectedDate && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setSelectedDate('')}
              className="text-xs text-accent text-left mb-1"
            >
              ← Выбрать другую дату
            </button>
            {loadingSlots ? (
              <Spinner compact />
            ) : slotsError ? (
              <ErrorState compact message={slotsError} />
            ) : slots.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-hint">На эту дату нет свободных слотов</p>
                <button
                  onClick={() => setSelectedDate('')}
                  className="mt-3 text-accent text-sm font-medium"
                >
                  Выбрать другую дату
                </button>
              </div>
            ) : slots.map(slot => (
              <button
                key={slot.id}
                onClick={() => { setData(d => ({ ...d, slot })); setStep('name') }}
                className="bg-card rounded-2xl px-4 py-3.5 text-left border border-tgline font-medium text-primary active:scale-[0.98] transition-transform flex items-center gap-2.5"
              >
                <Clock size={18} className="text-accent shrink-0" /> {new Date(slot.datetime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </button>
            ))}
          </div>
        )}

        {/* Step 3 — enter name */}
        {step === 'name' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-hint">Как вас зовут?</p>
            <input
              type="text"
              value={data.name}
              onChange={e => setData(d => ({ ...d, name: e.target.value }))}
              placeholder="Ваше имя"
              className="w-full bg-card border border-tgline rounded-2xl px-4 py-3 text-primary placeholder-hint focus:outline-none focus:ring-2 focus:ring-accent"
              autoFocus
            />
            <button
              disabled={!data.name.trim()}
              onClick={() => setStep('phone')}
              className="w-full py-3.5 bg-accent text-white rounded-full font-semibold disabled:opacity-40"
            >
              Далее
            </button>
          </div>
        )}

        {/* Step 4 — enter phone */}
        {step === 'phone' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-hint">Введите номер телефона</p>
            <input
              type="tel"
              value={data.phone}
              onChange={e => setData(d => ({ ...d, phone: e.target.value }))}
              placeholder="+7 999 000-00-00"
              className="w-full bg-card border border-tgline rounded-2xl px-4 py-3 text-primary placeholder-hint focus:outline-none focus:ring-2 focus:ring-accent"
              autoFocus
            />
            {data.phone.trim() && !isValidPhone(data.phone) && (
              <p className="text-xs text-red-500 dark:text-red-400 -mt-2">
                Введите российский номер полностью, например +7 999 000-00-00
              </p>
            )}
            <button
              disabled={!isValidPhone(data.phone)}
              onClick={() => setStep('confirm')}
              className="w-full py-3.5 bg-accent text-white rounded-full font-semibold disabled:opacity-40"
            >
              Далее
            </button>
          </div>
        )}

        {/* Step 5 — confirm */}
        {step === 'confirm' && (
          <ConfirmStep data={data} onConfirm={() => setStep('done')} onCancel={() => navigate('/')} />
        )}
      </div>
    </div>
  )
}

function ConfirmStep({
  data,
  onConfirm,
  onCancel,
}: {
  data: BookingData
  onConfirm: () => void
  onCancel: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')

  const handleSubmit = async () => {
    setSubmitting(true)
    setApiError('')
    try {
      const result = await api.post<{ id: number }>('/api/bookings', {
        service_id: data.service!.id,
        slot_id: data.slot!.id,
        name: data.name,
        phone: data.phone,
      })
      // Сохраняем ID записи в localStorage для "Мои записи" без Telegram-авторизации
      try {
        const stored: number[] = JSON.parse(localStorage.getItem('bookingIds') || '[]')
        if (!stored.includes(result.id)) stored.push(result.id)
        localStorage.setItem('bookingIds', JSON.stringify(stored))
      } catch {}
      onConfirm()
    } catch (e: any) {
      setApiError(e.message.includes('409') ? 'Слот уже занят или вы уже записаны на это время' : e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card rounded-2xl p-5 border border-tgline space-y-3">
        <h3 className="font-semibold text-primary text-base">Подтвердите запись</h3>
        <div className="space-y-2 text-sm">
          <Row label="Услуга" value={data.service?.name ?? ''} />
          <Row label="Дата и время" value={data.slot ? formatDT(data.slot.datetime) : ''} />
          <Row label="Стоимость" value={`${data.service?.price} ₽`} />
          <Row label="Имя" value={data.name} />
          <Row label="Телефон" value={data.phone} />
        </div>
      </div>
      {apiError && (
        <p className="text-red-500 dark:text-red-400 text-sm text-center bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-2">{apiError}</p>
      )}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-3.5 bg-accent text-white rounded-full font-bold text-base disabled:opacity-60"
      >
        {submitting ? 'Отправляем...' : 'Подтвердить запись'}
      </button>
      <button onClick={onCancel} className="w-full py-3 text-hint text-sm">
        Отменить
      </button>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-hint">{label}</span>
      <span className="text-primary font-medium">{value}</span>
    </div>
  )
}

