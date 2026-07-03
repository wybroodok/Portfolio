import { ChevronRight, MessageCircle, Moon, ShieldCheck, Sun } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import AboutInfo from '../components/AboutInfo'
import PageHeader from '../components/PageHeader'
import { MASTER_CONTACT_URL } from '../siteConfig'
import { openTelegramChat, sanitizeDisplayName } from '../telegram'
import { applyTheme, getTheme, type Theme } from '../theme'

export default function Settings() {
  const navigate = useNavigate()
  const { user, isAdmin, loading } = useAuth()
  const [theme, setTheme] = useState<Theme>(getTheme())

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
  }

  const displayName = sanitizeDisplayName(user?.first_name ?? 'Гость')
  const username = user?.username ? `@${user.username}` : null

  return (
    <div className="page-enter flex flex-col min-h-[100dvh] pb-24">
      {/* Настройки доступны только через нижнее меню — стрелки "назад" нет */}
      <PageHeader title="Настройки" />

      <div className="px-4 pt-4 flex flex-col gap-6">
        {/* Профиль */}
        <div className="bg-card rounded-2xl p-4 border border-tgline flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center text-xl font-bold shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-primary truncate">{displayName}</div>
            {username && <div className="text-xs text-hint truncate">{username}</div>}
            {!loading && (
              <span
                className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                  isAdmin ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-accent-soft text-accent'
                }`}
              >
                {isAdmin ? 'Администратор' : 'Клиент'}
              </span>
            )}
          </div>
        </div>

        {/* Сгруппированный список настроек — единый контейнер с разделителями,
            как нативные экраны настроек в Telegram/iOS, а не отдельные карточки. */}
        <div className="bg-card rounded-2xl border border-tgline divide-y divide-tgline overflow-hidden">
          <button
            onClick={toggleTheme}
            className="w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent-soft flex items-center justify-center shrink-0">
                {theme === 'dark'
                  ? <Moon size={20} strokeWidth={2.2} className="text-accent" />
                  : <Sun size={20} strokeWidth={2.2} className="text-accent" />}
              </div>
              <span className="font-medium text-primary">Тёмная тема</span>
            </div>
            <div
              className={`w-11 h-6 rounded-full transition-colors duration-300 relative ${
                theme === 'dark' ? 'bg-accent' : 'bg-tgline'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-300 ${
                  theme === 'dark' ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`}
                style={{ transitionTimingFunction: 'var(--ease-spring)' }}
              />
            </div>
          </button>

          {/* Админ-панель видна всем — доступ проверяется при заходе (AdminGuard) */}
          <button
            onClick={() => navigate('/admin')}
            className="w-full p-4 text-left flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-accent-soft flex items-center justify-center shrink-0">
              <ShieldCheck size={20} strokeWidth={2.2} className="text-accent" />
            </div>
            <div>
              <div className="font-semibold text-primary text-sm">Админ-панель</div>
              <div className="text-xs text-hint mt-0.5">Управление салоном</div>
            </div>
            <ChevronRight size={18} className="ml-auto text-hint" />
          </button>

          {/* Настраивается в siteConfig.ts (MASTER_CONTACT_URL) — без ссылки
              кнопка не показывается. */}
          {MASTER_CONTACT_URL && (
            <button
              onClick={() => openTelegramChat(MASTER_CONTACT_URL)}
              className="w-full p-4 text-left flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-accent-soft flex items-center justify-center shrink-0">
                <MessageCircle size={20} strokeWidth={2.2} className="text-accent" />
              </div>
              <div className="font-medium text-primary text-sm">Связаться с мастером</div>
              <ChevronRight size={18} className="ml-auto text-hint" />
            </button>
          )}
        </div>

        {/* Тот же контент, что и на отдельной странице "О нас" (см. Home) —
            дублируется здесь для доступа без перехода на другую вкладку. */}
        <AboutInfo />
      </div>
    </div>
  )
}
