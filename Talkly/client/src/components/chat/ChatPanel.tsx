import { useEffect } from 'react';
import { socketManager } from '../../lib/socket/SocketManager';
import { useChatStore } from '../../store/chatStore';
import { usePresenceStore } from '../../store/presenceStore';
import { useAuthStore } from '../../store/authStore';
import { formatPresence, isOnline } from '../../lib/presence';
import { roomTitle, roomFace } from '../../lib/rooms';
import { Avatar } from '../common/Avatar';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import type { Room } from '../../../../shared/events';

/** Оркестрирует открытую комнату: join → гидрация кэша, leave при смене. */
export function ChatPanel({
  room,
  infoOpen,
  onToggleInfo,
}: {
  room: Room;
  infoOpen: boolean;
  onToggleInfo: () => void;
}) {
  const me = useAuthStore((s) => s.me);
  const setActiveRoom = useChatStore((s) => s.setActiveRoom);
  const hydrateRoom = useChatStore((s) => s.hydrateRoom);
  const presenceStates = usePresenceStore((s) => s.states);

  useEffect(() => {
    let cancelled = false;
    setActiveRoom(room.id);
    socketManager.joinRoom(room.id).then((ack) => {
      if (!cancelled && ack.ok) hydrateRoom(room.id, ack.messages);
    });
    return () => {
      cancelled = true;
      socketManager.leaveRoom(room.id);
    };
  }, [room.id, setActiveRoom, hydrateRoom]);

  if (!me) return null;
  const face = roomFace(room, me.id);

  const subtitle =
    room.kind === 'group'
      ? `${room.members.length} участников · ${room.members.filter((m) => isOnline(presenceStates[m.id])).length} в сети`
      : face
        ? formatPresence(presenceStates[face.id])
        : '';

  return (
    <div className="flex h-full flex-col bg-charcoal">
      <header className="flex items-center gap-3 border-b border-hairline px-6 py-3">
        {face ? (
          <Avatar user={face} size="md" presence />
        ) : (
          <div className="grid h-9 w-9 place-items-center rounded-full bg-cyber/20 text-cyber">#</div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-semibold text-white">{roomTitle(room, me.id)}</h1>
          <p className="truncate text-xs text-muted">{subtitle}</p>
        </div>
        <button
          onClick={onToggleInfo}
          title={infoOpen ? 'Скрыть панель' : 'Показать панель'}
          className={`rounded-md px-2 py-1 text-lg transition-colors ${
            infoOpen ? 'text-cyber' : 'text-muted hover:text-gray-200'
          }`}
        >
          ⓘ
        </button>
      </header>

      <MessageList roomId={room.id} />
      <TypingIndicator roomId={room.id} />
      <MessageInput roomId={room.id} />
    </div>
  );
}
