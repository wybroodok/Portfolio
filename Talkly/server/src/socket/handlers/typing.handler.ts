import type { TalklyServer, TalklySocket } from '../index.js';

/**
 * «User is typing…».
 *
 * Дебаунс и авто-затухание живут на КЛИЕНТЕ (там дешевле всего экономить
 * трафик — не слать событие на каждую клавишу). Сервер намеренно тонкий:
 * просто ретранслирует start/stop остальным в комнате. Это делает фичу
 * бесплатной по нагрузке и корректной при горизонтальном масштабировании
 * (broadcast идёт через Redis-адаптер).
 */
export function registerTypingHandlers(_io: TalklyServer, socket: TalklySocket): void {
  const emit = (roomId: string, isTyping: boolean) => {
    if (!socket.rooms.has(roomId)) return;
    socket.to(roomId).emit('typing:update', {
      roomId,
      user: socket.data.user,
      isTyping,
    });
  };

  socket.on('typing:start', ({ roomId }) => emit(roomId, true));
  socket.on('typing:stop', ({ roomId }) => emit(roomId, false));
}
