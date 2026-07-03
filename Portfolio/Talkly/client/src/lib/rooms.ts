import type { Room, UserSummary } from '../../../shared/events';

/** Для DM показываем собеседника, для группы — её имя. */
export function roomTitle(room: Room, meId: string): string {
  if (room.kind === 'group') return room.name || 'Группа';
  const other = room.members.find((m) => m.id !== meId);
  return other?.displayName ?? 'Диалог';
}

/** Аватар-«лицо» комнаты: собеседник в DM, иначе первый участник/группа. */
export function roomFace(room: Room, meId: string): UserSummary | null {
  if (room.kind === 'dm') return room.members.find((m) => m.id !== meId) ?? null;
  return null;
}
