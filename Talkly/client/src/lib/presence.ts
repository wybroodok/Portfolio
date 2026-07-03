import type { Presence } from '../store/presenceStore';

/** Человеко-читаемый статус сети: «в сети / был(а) недавно / был(а) давно». */
export function formatPresence(p: Presence | undefined): string {
  if (!p || p.state === 'online') return p?.state === 'online' ? 'в сети' : 'не в сети';
  if (!p.lastSeen) return 'не в сети';

  const diff = Date.now() - p.lastSeen;
  const min = 60_000;
  const hour = 60 * min;
  const day = 24 * hour;

  if (diff < 2 * min) return 'был(а) только что';
  if (diff < hour) return `был(а) ${Math.floor(diff / min)} мин назад`;
  if (diff < day) {
    const t = new Date(p.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `был(а) сегодня в ${t}`;
  }
  if (diff < 7 * day) return `был(а) ${Math.floor(diff / day)} дн назад`;
  return 'был(а) давно';
}

/** true — считаем пользователя онлайн. */
export function isOnline(p: Presence | undefined): boolean {
  return p?.state === 'online';
}
