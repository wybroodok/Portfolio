import { CalendarDays, ClipboardList, Gift, Info } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BUSINESS_NAME, BUSINESS_TAGLINE, HOME_BANNER } from '../siteConfig'
import { getTgUser, openExternalLink, sanitizeDisplayName } from '../telegram'

const cards = [
  { to: '/booking',     Icon: CalendarDays,   label: 'Записаться',   desc: 'Выберите услугу и время'      },
  { to: '/my-bookings', Icon: ClipboardList,  label: 'Мои записи',   desc: 'Ваши активные записи'          },
  { to: '/promotions',  Icon: Gift,           label: 'Акции',        desc: 'Текущие предложения'           },
  { to: '/about',       Icon: Info,           label: 'О нас',        desc: 'Контакты и информация'         },
]

export default function Home() {
  const navigate = useNavigate()
  const user = getTgUser()
  const firstName = sanitizeDisplayName(user?.first_name ?? 'Гость')

  return (
    <div className="page-enter flex flex-col min-h-[100dvh]">
      {/* Hero — плоский, в цвет приложения, а не отдельный цветной блок:
          так выглядят экраны Wallet/TON Space внутри Telegram */}
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-2xl font-bold leading-snug text-primary">Привет {firstName}!</h1>
        <p className="text-hint text-sm mt-1">{BUSINESS_NAME} — {BUSINESS_TAGLINE}</p>
      </div>

      {/* Cards grid + баннер — общий отступ снизу под нижнее меню один раз,
          на всём блоке, а не на баннере отдельно (иначе без заданной
          картинки карточки прижимались бы к нижнему меню без отступа). */}
      <div className="flex flex-col gap-3 p-4 pb-24">
        <div className="grid grid-cols-2 gap-3">
          {cards.map(card => (
            <button
              key={card.to}
              // Некоторые из этих разделов (Запись, Мои записи, Акции) есть и в
              // нижнем меню — метим переход как "из главного меню" через state,
              // чтобы страница показала стрелку "назад" именно в этом случае
              // (а не когда на тот же раздел перешли по вкладке снизу).
              onClick={() => navigate(card.to, { state: { from: 'home' } })}
              className="bg-card rounded-2xl p-4 text-left border border-tgline active:scale-[0.94] transition-transform duration-200"
              style={{ transitionTimingFunction: 'var(--ease-spring)' }}
            >
              <div className="w-11 h-11 rounded-xl bg-accent-soft flex items-center justify-center mb-2.5">
                <card.Icon size={24} strokeWidth={2.2} className="text-accent" />
              </div>
              <div className="font-semibold text-primary text-sm">{card.label}</div>
              <div className="text-xs text-hint mt-0.5">{card.desc}</div>
            </button>
          ))}
        </div>

        {/* Баннер — настраивается в src/siteConfig.ts (HOME_BANNER). Без
            заданной картинки просто не рендерится. Фиксированное
            соотношение сторон 2:1 с object-cover — баннер всегда одного
            размера независимо от разрешения загруженной картинки. */}
        {HOME_BANNER.imageUrl && (
          HOME_BANNER.linkUrl ? (
            <button
              onClick={() => openExternalLink(HOME_BANNER.linkUrl)}
              className="rounded-2xl overflow-hidden border border-tgline active:scale-[0.98] transition-transform duration-200"
              style={{ transitionTimingFunction: 'var(--ease-spring)' }}
            >
              <img src={HOME_BANNER.imageUrl} alt="" className="w-full aspect-2/1 object-cover block" />
            </button>
          ) : (
            <div className="rounded-2xl overflow-hidden border border-tgline">
              <img src={HOME_BANNER.imageUrl} alt="" className="w-full aspect-2/1 object-cover block" />
            </div>
          )
        )}
      </div>
    </div>
  )
}
