import { dataClient, keys } from '../config/redis.js';
import { env } from '../config/env.js';
import type { UserId } from '../../../shared/events.js';

/**
 * Синхронизация сессий через Redis KV.
 *
 * Проблема: при перезагрузке страницы браузер создаёт новый сокет ДО того,
 * как старый успел отвалиться → дубли коннектов и «призрачный» online.
 *
 * Решение: держим userSession(userId) -> активный socketId. При регистрации
 * нового сокета возвращаем предыдущий socketId (если был) — вызывающий код
 * дисконнектит устаревший сокет. Обратный маппинг socketOwner нужен, чтобы
 * на disconnect знать владельца без парсинга состояния.
 */

export interface RegisterResult {
  /** socketId предыдущей активной сессии, который следует отключить. */
  staleSocketId: string | null;
}

export async function registerSession(
  userId: UserId,
  socketId: string,
): Promise<RegisterResult> {
  const sessionKey = keys.userSession(userId);
  const prev = await dataClient.get(sessionKey);

  const multi = dataClient.multi();
  multi.set(sessionKey, socketId, { EX: env.sessionTtlSeconds });
  multi.set(keys.socketOwner(socketId), userId, { EX: env.sessionTtlSeconds });
  await multi.exec();

  return { staleSocketId: prev && prev !== socketId ? prev : null };
}

/** Продлевает TTL сессии (вызывается на heartbeat/активность). */
export async function touchSession(userId: UserId, socketId: string): Promise<void> {
  const multi = dataClient.multi();
  multi.expire(keys.userSession(userId), env.sessionTtlSeconds);
  multi.expire(keys.socketOwner(socketId), env.sessionTtlSeconds);
  await multi.exec();
}

/** Снимает сессию на disconnect — но только если она всё ещё принадлежит этому сокету. */
export async function clearSession(socketId: string): Promise<UserId | null> {
  const userId = await dataClient.get(keys.socketOwner(socketId));
  if (!userId) return null;

  const current = await dataClient.get(keys.userSession(userId));
  const multi = dataClient.multi();
  multi.del(keys.socketOwner(socketId));
  // Не затираем сессию, если пользователь уже переподключился новым сокетом.
  if (current === socketId) {
    multi.del(keys.userSession(userId));
  }
  await multi.exec();
  return userId;
}
