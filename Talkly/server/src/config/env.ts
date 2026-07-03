import 'dotenv/config';

/** Строгая валидация окружения на старте — падаем рано, а не в рантайме. */
function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`[env] Missing required variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  /** Идентификатор инстанса — попадает в логи, помогает отлаживать горизонтальное масштабирование. */
  instanceId: process.env.INSTANCE_ID ?? `node-${process.pid}`,
  corsOrigin: required('CORS_ORIGIN', 'http://localhost:5173'),
  /** Публичный базовый URL сервера — для абсолютных ссылок на загруженные файлы. */
  publicUrl: process.env.PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? 4000}`,
  /** Максимальный размер загружаемого файла (байт). */
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES ?? 25 * 1024 * 1024),
  /** Куда сохранять загруженные файлы. */
  uploadDir: process.env.UPLOAD_DIR ?? 'uploads',
  redisUrl: required('REDIS_URL', 'redis://localhost:6379'),
  databaseUrl: required('DATABASE_URL', 'postgres://talkly:talkly@localhost:5432/talkly'),
  jwtSecret: required('JWT_SECRET', 'dev-only-insecure-secret-change-me'),
  // Ловим ниже (после сборки env), т.к. isProd зависит от nodeEnv.
  /** Сколько последних сообщений держим в горячем Redis-кэше комнаты. */
  roomCacheSize: Number(process.env.ROOM_CACHE_SIZE ?? 50),
  /** TTL активной сокет-сессии в Redis (сек). Продлевается на heartbeat. */
  sessionTtlSeconds: Number(process.env.SESSION_TTL_SECONDS ?? 60 * 60 * 24),
} as const;

export const isProd = env.nodeEnv === 'production';

// В проде запрещаем стартовать с дефолтным (публично известным) JWT-секретом —
// иначе токены тривиально подделываются. Падаем рано и явно.
if (isProd && env.jwtSecret === 'dev-only-insecure-secret-change-me') {
  throw new Error(
    '[env] JWT_SECRET must be set to a strong, non-default value in production',
  );
}
