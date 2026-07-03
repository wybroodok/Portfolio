import { Camera, Clock, MapPin, Phone } from 'lucide-react'
import { ABOUT_DESCRIPTION, BUSINESS_NAME, CONTACTS, SPECIALISTS_TEXT, SPECIALISTS_TITLE } from '../siteConfig'

const items = [
  { Icon: MapPin, label: 'Адрес', value: CONTACTS.address },
  { Icon: Phone, label: 'Телефон', value: CONTACTS.phone },
  { Icon: Clock, label: 'Часы работы', value: CONTACTS.hours },
  { Icon: Camera, label: 'Instagram', value: CONTACTS.instagram },
  // Пустое значение в siteConfig.ts (CONTACTS.*) — просто не показываем строку,
  // а не оставляем пустое место в списке.
].filter(item => item.value)

// Контент раздела "О нас" — общий для отдельной страницы (карточка на
// главной) и блока внутри "Настроек", чтобы не дублировать текст в двух
// местах и держать его синхронным. Все тексты берутся из siteConfig.ts —
// см. README.md, чтобы поменять их под свой бизнес.
export default function AboutInfo() {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card rounded-2xl p-5 border border-tgline">
        <h2 className="font-bold text-lg mb-1 text-primary">{BUSINESS_NAME}</h2>
        <p className="text-hint text-sm leading-relaxed">{ABOUT_DESCRIPTION}</p>
      </div>

      {/* Сгруппированный список, как в нативных настройках iOS/Telegram */}
      {items.length > 0 && (
        <div className="bg-card rounded-2xl divide-y divide-tgline border border-tgline">
          {items.map(item => (
            <div key={item.label} className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-accent-soft flex items-center justify-center shrink-0">
                <item.Icon size={18} strokeWidth={2.2} className="text-accent" />
              </div>
              <div>
                <div className="text-xs text-hint">{item.label}</div>
                <div className="text-sm font-medium text-primary">{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {SPECIALISTS_TEXT && (
        <div className="bg-accent-soft rounded-2xl p-4">
          <p className="text-xs text-accent font-medium mb-1">{SPECIALISTS_TITLE}</p>
          <p className="text-sm text-primary/80 leading-relaxed">{SPECIALISTS_TEXT}</p>
        </div>
      )}
    </div>
  )
}
