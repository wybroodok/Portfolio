import { ChevronLeft } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTg, isInsideTelegram } from '../telegram'

interface Props {
  title: string
  back?: string | (() => void)
}

export default function PageHeader({ title, back }: Props) {
  const navigate = useNavigate()
  const tg = getTg()
  const inTelegram = isInsideTelegram()

  const handleBack = () => {
    if (!back) return
    if (typeof back === 'function') back()
    else navigate(back)
  }

  // Нативная кнопка "назад" в шапке самого Telegram — так выглядят
  // Wallet/TON Space, а не собственная стрелка в теле страницы. За пределами
  // Telegram (обычный браузер, тестирование) BackButton недоступна — тогда
  // остаётся своя стрелка ниже как запасной вариант.
  useEffect(() => {
    const btn = tg?.BackButton
    if (!btn || !inTelegram) return
    if (!back) { btn.hide(); return }
    btn.onClick(handleBack)
    btn.show()
    return () => {
      btn.offClick(handleBack)
      btn.hide()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [back])

  return (
    <header className="sticky top-0 z-10 bg-header border-b border-tgline flex items-center gap-3 px-4 py-3">
      {!inTelegram && back && (
        <button
          onClick={handleBack}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-accent-soft text-accent shrink-0 active:scale-90 transition-transform duration-200"
          style={{ transitionTimingFunction: 'var(--ease-spring)' }}
        >
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>
      )}
      <h1 className="text-lg font-semibold text-primary leading-tight">{title}</h1>
    </header>
  )
}
