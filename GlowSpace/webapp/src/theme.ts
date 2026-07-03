import { getTg } from './telegram'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

// Синхронизировано со значениями --tg-header-bg / --tg-bg-secondary в
// index.css — Telegram.WebApp.setHeaderColor/setBackgroundColor принимают
// только hex-строку, ссылаться на CSS-переменную напрямую нельзя.
const HEADER_COLOR: Record<Theme, string> = { light: '#ffffff', dark: '#1f2024' }
const BG_COLOR: Record<Theme, string> = { light: '#f0f0f3', dark: '#0e0f12' }

export function getTheme(): Theme {
  return (localStorage.getItem(STORAGE_KEY) as Theme) || 'light'
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  localStorage.setItem(STORAGE_KEY, theme)

  // Красит саму шапку/системный фон Telegram под тему приложения — иначе при
  // переключении на тёмную тему верх экрана (chrome самого Telegram) остаётся
  // светлым, а контент под ним — уже тёмным.
  const tg = getTg()
  try {
    tg?.setHeaderColor?.(HEADER_COLOR[theme])
    tg?.setBackgroundColor?.(BG_COLOR[theme])
  } catch {
    // Старые версии клиента Telegram могут не поддерживать эти методы —
    // тема приложения при этом всё равно применяется корректно.
  }
}

// Вызывается один раз при загрузке приложения, чтобы сразу применить
// сохранённую тему до первого рендера (без мигания светлой темой).
export function initTheme() {
  applyTheme(getTheme())
}
