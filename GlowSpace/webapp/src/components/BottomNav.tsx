import { Calendar, ClipboardList, Gift, Home, Settings } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

const tabs = [
  { to: '/',            Icon: Home,          label: 'Главная'    },
  { to: '/booking',     Icon: Calendar,      label: 'Запись'     },
  { to: '/my-bookings', Icon: ClipboardList, label: 'Мои записи' },
  { to: '/promotions',  Icon: Gift,          label: 'Акции'      },
  { to: '/settings',    Icon: Settings,      label: 'Настройки'  },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const activeIndex = Math.max(0, tabs.findIndex(t => (t.to === '/' ? location.pathname === '/' : location.pathname.startsWith(t.to))))

  // Раньше переключение вкладок оборачивалось в View Transitions API
  // (document.startViewTransition) для "перетекания" одного экрана в
  // другой — в десктопном браузере выглядело гладко, но во встроенном
  // WebView Telegram на телефоне давало заметный подвисающий рывок перед
  // переходом (API там реализована менее предсказуемо). Обычный переход
  // + лёгкая CSS-анимация появления страницы (.page-enter) работает
  // одинаково стабильно везде.
  const go = (to: string) => {
    if (to === location.pathname) return
    navigate(to)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-header border-t border-tgline flex items-stretch z-20 pb-[env(safe-area-inset-bottom)]">
      {/* Скользящий индикатор активной вкладки — плавно едет к новой позиции
          вместо мгновенной подсветки, как "текучая" iOS-навигация. */}
      <div
        className="absolute top-1.5 bottom-1.5 left-0 w-1/5 pointer-events-none px-1.5"
        style={{ transform: `translateX(${activeIndex * 100}%)`, transition: 'transform 0.35s var(--ease-spring)' }}
      >
        <div className="w-full h-full rounded-2xl bg-accent-soft" />
      </div>

      {tabs.map((tab, i) => {
        const isActive = i === activeIndex
        return (
          <button
            key={tab.to}
            onClick={() => go(tab.to)}
            className="relative flex-1 min-w-0 flex flex-col items-center justify-center gap-1 py-2 px-0.5"
          >
            {/* stroke-width держим постоянным — смена через JS не анимируется
                плавно CSS-переходом (это дискретный SVG-атрибут, не CSS-
                свойство) и на слабых устройствах выглядела как дёрганый скачок
                поверх плавного transform/color. Только transform + color —
                самые дешёвые для GPU свойства. */}
            <tab.Icon
              size={26}
              strokeWidth={2.2}
              className={`transition-[transform,color] duration-300 ${isActive ? 'text-accent scale-110' : 'text-hint scale-100'}`}
            />
            <span
              className={`text-[10px] leading-tight text-center transition-colors duration-300 ${isActive ? 'text-accent font-medium' : 'text-hint'}`}
            >
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
