import { createClient, type RedisClientType } from 'redis';
import { env } from './env.js';

/**
 * Три отдельных соединения — это требование Redis Pub/Sub:
 *   - pubClient  — публикует и обслуживает адаптер Socket.io;
 *   - subClient  — подписан (в режиме subscribe нельзя выполнять обычные команды);
 *   - dataClient — обычные операции (кэш комнат, сессии, presence).
 *
 * subClient обязан быть отдельным дублем pubClient — так требует @socket.io/redis-adapter.
 */
export const pubClient: RedisClientType = createClient({ url: env.redisUrl });
export const subClient: RedisClientType = pubClient.duplicate();
export const dataClient: RedisClientType = createClient({ url: env.redisUrl });

const all = [pubClient, subClient, dataClient];

for (const client of all) {
  client.on('error', (err) => console.error('[redis] client error:', err.message));
}

export async function connectRedis(): Promise<void> {
  await Promise.all(all.map((c) => c.connect()));
  console.log(`[redis] connected (instance=${env.instanceId})`);
}

export async function disconnectRedis(): Promise<void> {
  await Promise.all(all.map((c) => c.quit()));
}

/* ---- Ключи-хелперы: единое место, чтобы не рассыпать строки по коду ---- */
export const keys = {
  /** ZSET: score = createdAt(ms), member = JSON сообщения. */
  roomMessages: (roomId: string) => `room:${roomId}:messages`,
  /** KV: активная сессия пользователя -> socketId (защита от дублей коннектов). */
  userSession: (userId: string) => `session:user:${userId}`,
  /** KV: socketId -> userId (обратный маппинг для disconnect). */
  socketOwner: (socketId: string) => `session:socket:${socketId}`,
  /** SET: сокеты одного пользователя (мультивкладки). */
  userSockets: (userId: string) => `presence:sockets:${userId}`,
  /** KV: presence-состояние пользователя. */
  userPresence: (userId: string) => `presence:state:${userId}`,
};
