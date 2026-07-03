import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '../../lib/api';
import { useRoomsStore } from '../../store/roomsStore';
import { useAuthStore } from '../../store/authStore';
import { usePresenceStore } from '../../store/presenceStore';
import { isOnline } from '../../lib/presence';
import { roomTitle, roomFace } from '../../lib/rooms';
import { Avatar } from '../common/Avatar';
import { NewGroupModal } from './NewGroupModal';
import type { Room, UserSummary } from '../../../../shared/events';

export function Sidebar({ onOpenProfile }: { onOpenProfile: () => void }) {
  const me = useAuthStore((s) => s.me);
  const rooms = useRoomsStore((s) => s.rooms);
  const activeId = useRoomsStore((s) => s.activeRoomId);
  const setActive = useRoomsStore((s) => s.setActive);
  const upsert = useRoomsStore((s) => s.upsert);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSummary[]>([]);
  const [groupOpen, setGroupOpen] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(debounce.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    debounce.current = setTimeout(async () => {
      try {
        setResults(await api.searchUsers(query));
      } catch {
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(debounce.current);
  }, [query]);

  async function openDm(username: string) {
    const room = await api.createDm(username);
    upsert(room);
    setActive(room.id);
    setQuery('');
    setResults([]);
  }

  if (!me) return null;

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-hairline px-4 py-3.5">
        <span className="text-lg font-bold tracking-tight">
          Talk<span className="text-cyber">ly</span>
        </span>
        <button
          onClick={() => setGroupOpen(true)}
          title="Новая группа"
          className="rounded-md bg-panel-hi px-2 py-1 text-sm text-cyber hover:bg-cyber hover:text-charcoal"
        >
          + группа
        </button>
      </header>

      {/* Поиск пользователей по юзернейму */}
      <div className="relative px-3 py-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по @username…"
          className="w-full rounded-lg bg-panel-hi px-3 py-2 text-sm text-gray-100 placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-cyber"
        />
        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute inset-x-3 z-20 mt-1 overflow-hidden rounded-lg border border-hairline bg-panel-hi shadow-xl"
            >
              {results.map((u) => (
                <button
                  key={u.id}
                  onClick={() => void openDm(u.username)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-cyber/10"
                >
                  <Avatar user={u} size="sm" presence />
                  <span className="min-w-0">
                    <p className="truncate text-sm">{u.displayName}</p>
                    <p className="truncate text-xs text-muted">@{u.username}</p>
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Список комнат */}
      <div className="flex-1 overflow-y-auto px-2">
        {rooms.length === 0 && (
          <p className="px-3 py-4 text-xs text-muted">
            Пока нет чатов. Найдите кого-нибудь через поиск или создайте группу.
          </p>
        )}
        {rooms.map((room) => (
          <RoomRow
            key={room.id}
            room={room}
            meId={me.id}
            active={room.id === activeId}
            onClick={() => setActive(room.id)}
          />
        ))}
      </div>

      {/* Мини-профиль */}
      <button
        onClick={onOpenProfile}
        className="flex items-center gap-3 border-t border-hairline px-4 py-3 text-left hover:bg-panel-hi"
      >
        <Avatar user={me} size="md" presence />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{me.displayName}</p>
          <p className="truncate text-xs text-muted">@{me.username}</p>
        </div>
      </button>

      <NewGroupModal open={groupOpen} onClose={() => setGroupOpen(false)} />
    </div>
  );
}

function RoomRow({
  room,
  meId,
  active,
  onClick,
}: {
  room: Room;
  meId: string;
  active: boolean;
  onClick: () => void;
}) {
  const face = roomFace(room, meId);
  const online = usePresenceStore((s) => (face ? isOnline(s.states[face.id]) : false));

  return (
    <button
      onClick={onClick}
      className={`relative flex w-full items-center gap-3 rounded-md px-3 py-2 transition-colors ${
        active ? 'bg-panel-hi' : 'hover:bg-panel-hi/60'
      }`}
    >
      {active && (
        <motion.span
          layoutId="active-room"
          className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-cyber"
        />
      )}
      {face ? (
        <Avatar user={face} size="md" presence />
      ) : (
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cyber/20 text-sm text-cyber">
          #
        </div>
      )}
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm">{roomTitle(room, meId)}</p>
        <p className="truncate text-xs text-muted">
          {room.kind === 'group'
            ? `${room.members.length} участн.`
            : online
              ? 'в сети'
              : 'не в сети'}
        </p>
      </div>
    </button>
  );
}
