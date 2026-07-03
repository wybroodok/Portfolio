// Читаем window.Telegram.WebApp заново при каждом обращении, а не кэшируем
// один раз при загрузке модуля — если Telegram выставляет объект/initData
// с небольшой задержкой после старта страницы, кэш на момент импорта мог
// навсегда остаться пустым, хотя данные уже давно доступны.
export function getTg(): any {
  return (window as any).Telegram?.WebApp ?? null
}

export interface TgUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
}

export function getTgUser(): TgUser | null {
  return getTg()?.initDataUnsafe?.user ?? null
}

// telegram-web-app.js подключён безусловно (см. index.html) и создаёт
// window.Telegram.WebApp со всей структурой API (включая BackButton) даже
// вне настоящего Telegram — просто как заглушку, ничего не делающую. Поэтому
// проверять реальный запуск внутри Telegram нужно не по наличию объекта, а
// по initData: она непустая, только если страница открыта именно как Mini
// App с настоящими параметрами запуска.
export function isInsideTelegram(): boolean {
  return Boolean(getTg()?.initData)
}

// Некоторые пользователи ставят в имя Telegram редкий эмодзи/юникод-символ
// (в т.ч. из приватной области Unicode — их значение зависит от конкретного
// приложения-отправителя и в принципе не имеет общего глифа), для которого
// в шрифте встроенного WebView нет отображения — вместо него показывается
// "битый" квадрат. Оставляем только буквы (любого языка), цифры, пробелы и
// базовую пунктуацию; всё остальное просто не показываем.
export function sanitizeDisplayName(name: string): string {
  const cleaned = name
    .replace(/[^\p{L}\p{N}\p{Zs}.,'-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned || 'Гость'
}

export function haptic(style: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') {
  getTg()?.HapticFeedback?.impactOccurred(style)
}

// Открывает произвольную внешнюю ссылку (баннер на главной и т.п.) —
// внутри Telegram через его собственный openLink (открывается во
// встроенном браузере, а не выкидывает из мини-аппа), вне Telegram —
// обычным способом.
export function openExternalLink(url: string) {
  const tg = getTg()
  if (isInsideTelegram() && tg?.openLink) {
    tg.openLink(url)
  } else {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

// Открывает t.me-ссылку (например личку с мастером) через openTelegramLink —
// это единственный корректный способ открыть чат внутри самого Telegram, а
// не во встроенном браузере (как сделал бы openLink для той же ссылки).
export function openTelegramChat(url: string) {
  const tg = getTg()
  if (isInsideTelegram() && tg?.openTelegramLink) {
    tg.openTelegramLink(url)
  } else {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}
