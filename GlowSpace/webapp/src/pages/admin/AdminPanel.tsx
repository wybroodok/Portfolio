import { AlertTriangle, BarChart3, CalendarPlus, ChevronRight, ClipboardList, Gift, Moon, Scissors } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'

const actions = [
  { to: '/admin/bookings',    Icon: ClipboardList, label: 'Все записи',      desc: 'Изменить, отменить, удалить'   },
  { to: '/admin/add-slot',    Icon: CalendarPlus,  label: 'Слоты',           desc: 'Добавить, изменить, удалить'   },
  { to: '/admin/add-service', Icon: Scissors,      label: 'Услуги',          desc: 'Добавить, изменить, удалить'   },
  { to: '/admin/reviews',     Icon: BarChart3,     label: 'Отзывы',          desc: 'Список отзывов клиентов'       },
  { to: '/admin/add-promo',   Icon: Gift,          label: 'Акции',           desc: 'Добавить, изменить, удалить'   },
  { to: '/admin/day-block',   Icon: Moon,          label: 'Я сегодня занят', desc: 'Отменить все записи на сегодня'},
]

export default function AdminPanel() {
  const navigate = useNavigate()

  return (
    <div className="page-enter flex flex-col min-h-[100dvh] pb-6">
      <PageHeader title="Админ-панель" back="/settings" />

      <div className="px-4 pt-3 pb-2">
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl px-3 py-2 flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Раздел для администратора</p>
        </div>
      </div>

      <div className="px-4 pt-2">
        {/* Сгруппированный список действий вместо отдельных карточек с тенью —
            как экраны настроек в самом Telegram. */}
        <div className="bg-card rounded-2xl border border-tgline divide-y divide-tgline overflow-hidden">
          {actions.map(action => (
            <button
              key={action.to}
              onClick={() => navigate(action.to)}
              className="w-full p-4 text-left flex items-center gap-3 active:bg-accent-soft transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-accent-soft flex items-center justify-center shrink-0">
                <action.Icon size={19} strokeWidth={2.2} className="text-accent" />
              </div>
              <div>
                <div className="font-semibold text-primary text-sm">{action.label}</div>
                <div className="text-xs text-hint mt-0.5">{action.desc}</div>
              </div>
              <ChevronRight size={18} className="ml-auto text-hint" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
