import { useState } from 'react';
import { api } from '../../lib/api';
import { useRoomsStore } from '../../store/roomsStore';
import { useAuthStore } from '../../store/authStore';
import { usePresenceStore } from '../../store/presenceStore';
import { formatPresence } from '../../lib/presence';
import { roomTitle, roomFace } from '../../lib/rooms';
import { Avatar } from '../common/Avatar';
import type { Room } from '../../../../shared/events';

/** Правая панель: сводка комнаты + участники + добавление (для групп). */
export function InfoPanel({ room, onOpenUser }: { room: Room; onOpenUser: (username: string) => void }) {
  const me = useAuthStore((s) => s.me);
  const upsert = useRoomsStore((s) => s.upsert);
  const presence = usePresenceStore((s) => s.states);
  const [addValue, setAddValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!me) return null;
  const face = roomFace(room, me.id);

  async function addMember() {
    const username = addValue.trim().replace(/^@/, '');
    if (!username || busy) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await api.addMember(room.id, username);
      upsert(updated);
      setAddValue('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full flex-col p-5">
      <div className="mb-5 text-center">
        {face ? (
          <div className="mx-auto mb-3 w-max">
            <Avatar user={face} size="xl" presence />
          </div>
        ) : (
          <div className="mx-auto mb-3 grid h-24 w-24 place-items-center rounded-full bg-cyber/20 text-3xl text-cyber">
            #
          </div>
        )}
        <h2 className="font-semibold text-white">{roomTitle(room, me.id)}</h2>
        <p className="text-xs text-muted">
          {room.kind === 'dm' ? 'Личный диалог' : `Группа · ${room.members.length} участников`}
        </p>
      </div>

      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Участники</p>
      <div className="flex-1 space-y-1 overflow-y-auto">
        {room.members.map((m) => (
          <button
            key={m.id}
            onClick={() => onOpenUser(m.username)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-panel-hi"
          >
            <Avatar user={m} size="md" presence />
            <span className="min-w-0">
              <p className="truncate text-sm text-gray-200">
                {m.displayName}
                {m.id === me.id && <span className="text-muted"> (вы)</span>}
              </p>
              <p className="truncate text-xs text-muted">{formatPresence(presence[m.id])}</p>
            </span>
          </button>
        ))}
      </div>

      {room.kind === 'group' && (
        <div className="mt-3 border-t border-hairline pt-3">
          <div className="flex gap-2">
            <input
              value={addValue}
              onChange={(e) => setAddValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void addMember()}
              placeholder="@username"
              className="min-w-0 flex-1 rounded-lg bg-panel-hi px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyber"
            />
            <button
              onClick={() => void addMember()}
              disabled={busy || !addValue.trim()}
              className="rounded-lg bg-cyber px-3 py-2 text-sm font-semibold text-charcoal disabled:opacity-30"
            >
              +
            </button>
          </div>
          {error && <p className="mt-1 text-xs text-electric">{error}</p>}
        </div>
      )}
    </div>
  );
}
