import type { Server as HttpServer } from 'node:http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { env } from '../config/env.js';
import { pubClient, subClient } from '../config/redis.js';
import { authMiddleware } from './auth.js';
import { registerHandlers } from './handlers/index.js';
import { registerSession, clearSession } from '../services/session.service.js';
import { addSocket, removeSocket } from '../services/presence.service.js';
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from '../../../shared/events.js';

export type TalklyServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type TalklySocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export function createSocketServer(httpServer: HttpServer): TalklyServer {
  const io: TalklyServer = new Server(httpServer, {
    cors: { origin: env.corsOrigin, credentials: true },
    // Redis-адаптер: события в комнатах ретранслируются между всеми инстансами.
    adapter: createAdapter(pubClient, subClient),
    // Экономия трафика: сжатие включаем только для крупных payload'ов.
    perMessageDeflate: { threshold: 1024 },
    // Стабильность реконнекта: буфер восстановления состояния соединения.
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    },
  });

  io.use(authMiddleware);

  io.on('connection', (socket) => {
    const { user } = socket.data;

    // ВАЖНО: обработчики навешиваются СИНХРОННО, до любых await. Иначе события,
    // отправленные клиентом сразу после 'connect' (например room:join), прилетят
    // раньше, чем слушатели, и будут молча потеряны Socket.io.
    registerHandlers(io, socket);

    // Персональная комната — для таргетных пушей (новый DM/группа, добавление).
    void socket.join(`user:${user.id}`);

    socket.data.ready = (async () => {
      // Регистрируем сессию; отключаем устаревший сокет того же пользователя.
      const { staleSocketId } = await registerSession(user.id, socket.id);
      if (staleSocketId) {
        io.in(staleSocketId).disconnectSockets(true);
      }

      // Presence: broadcast только на реальном переходе offline→online.
      const online = await addSocket(user.id, socket.id);
      if (online.changed) {
        io.emit('presence:update', { userId: user.id, state: 'online', lastSeen: null });
      }

      socket.emit('session:ready', user);
    })();

    socket.on('disconnect', async () => {
      await clearSession(socket.id);
      const offline = await removeSocket(user.id, socket.id);
      if (offline.changed) {
        io.emit('presence:update', {
          userId: user.id,
          state: 'offline',
          lastSeen: offline.lastSeen ?? Date.now(),
        });
      }
    });
  });

  return io;
}
