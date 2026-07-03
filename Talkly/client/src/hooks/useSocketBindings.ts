import { useEffect } from 'react';
import { socketManager } from '../lib/socket/SocketManager';
import { useChatStore } from '../store/chatStore';
import { usePresenceStore } from '../store/presenceStore';
import { useConnectionStore } from '../store/connectionStore';
import { useRoomsStore } from '../store/roomsStore';
import { useAuthStore } from '../store/authStore';

/**
 * Единая точка маршрутизации socket-событий в Zustand-сторы.
 * Монтируется один раз в корне; компоненты только читают сторы.
 */
export function useSocketBindings(token: string): void {
  useEffect(() => {
    const socket = socketManager.connect(token);
    const chat = useChatStore.getState();
    const presence = usePresenceStore.getState();
    const conn = useConnectionStore.getState();
    const rooms = useRoomsStore.getState();
    const auth = useAuthStore.getState();

    socket.on('connect', () => conn.setStatus('online'));
    socket.io.on('reconnect_attempt', () => conn.setStatus('reconnecting'));
    socket.on('disconnect', (reason) => {
      conn.setStatus(reason === 'io server disconnect' ? 'offline' : 'reconnecting');
    });
    socket.io.on('reconnect', () => conn.setStatus('online'));

    socket.on('session:ready', (me) => auth.patchMe(me));
    socket.on('message:new', (m) => chat.addIncoming(m));
    socket.on('message:read', ({ roomId, messageIds, readerId }) =>
      chat.applyRead(roomId, messageIds, readerId),
    );
    socket.on('message:edited', ({ roomId, message }) => chat.applyEdit(roomId, message));
    socket.on('message:reaction', ({ roomId, messageId, reactions }) =>
      chat.applyReaction(roomId, messageId, reactions),
    );
    socket.on('typing:update', ({ roomId, user, isTyping }) =>
      chat.setTyping(roomId, user.id, user.displayName, isTyping),
    );
    socket.on('presence:update', ({ userId, state, lastSeen }) =>
      presence.setPresence(userId, { state, lastSeen }),
    );
    socket.on('room:upsert', (room) => rooms.upsert(room));

    return () => {
      socket.off();
      socket.io.off('reconnect_attempt');
      socket.io.off('reconnect');
    };
  }, [token]);
}
