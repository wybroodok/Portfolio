import type { Socket } from 'socket.io';
import { randomUUID } from 'node:crypto';
import { verifyToken } from '../services/auth.service.js';
import { getUserById } from '../services/user.service.js';

/**
 * Валидация handshake до установления соединения.
 *
 * Токен несёт только userId; профиль (username, имя, аватар) грузим из БД —
 * она источник истины, ведь профиль редактируемый. Пользователь кладётся в
 * socket.data, дальше хендлеры доверяют ему, а не клиентским payload'ам.
 */
export async function authMiddleware(
  socket: Socket,
  next: (err?: Error) => void,
): Promise<void> {
  const token = socket.handshake.auth?.token as string | undefined;
  const userId = token ? verifyToken(token) : null;
  if (!userId) return next(new Error('unauthorized'));

  const user = await getUserById(userId);
  if (!user) return next(new Error('unauthorized: user not found'));

  socket.data.user = {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarColor: user.avatarColor,
    avatarUrl: user.avatarUrl,
  };
  socket.data.sessionId = randomUUID();
  next();
}
