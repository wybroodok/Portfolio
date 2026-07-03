import type { TalklyServer, TalklySocket } from '../index.js';
import { getHotMessages, getHistoryPage } from '../../services/message.service.js';
import { isMember } from '../../services/room.service.js';

/**
 * Комнаты: join/leave + отдача истории.
 * join теперь проверяет членство в БД — приватные DM/группы недоступны чужим.
 */
export function registerRoomHandlers(_io: TalklyServer, socket: TalklySocket): void {
  socket.on('room:join', async ({ roomId }, ack) => {
    try {
      await socket.data.ready;
      if (!(await isMember(roomId, socket.data.user.id))) {
        return ack({ ok: false, messages: [], error: 'not a member' });
      }
      await socket.join(roomId);
      const messages = await getHotMessages(roomId);
      ack({ ok: true, messages });
    } catch (err) {
      ack({ ok: false, messages: [], error: (err as Error).message });
    }
  });

  socket.on('room:leave', ({ roomId }) => {
    void socket.leave(roomId);
  });

  socket.on('history:page', async ({ roomId, before, limit }, ack) => {
    try {
      if (!socket.rooms.has(roomId)) {
        return ack({ ok: false, messages: [], hasMore: false, error: 'not in room' });
      }
      const safeLimit = Math.min(Math.max(1, Number(limit) || 50), 100);
      const { messages, hasMore } = await getHistoryPage(roomId, before, safeLimit);
      ack({ ok: true, messages, hasMore });
    } catch (err) {
      ack({ ok: false, messages: [], hasMore: false, error: (err as Error).message });
    }
  });
}
