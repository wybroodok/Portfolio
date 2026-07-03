import { createServer } from 'node:http';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { assertDbConnection, pool } from './db/pool.js';
import { createSocketServer } from './socket/index.js';
import { createRoutes } from './http/routes.js';

async function bootstrap(): Promise<void> {
  await connectRedis();
  await assertDbConnection();

  const uploadPath = resolve(env.uploadDir);
  mkdirSync(uploadPath, { recursive: true });

  const app = express();
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json());
  app.get('/healthz', (_req, res) => res.json({ ok: true, instance: env.instanceId }));
  // Загруженные медиа — статикой (кэшируемо на год, файлы иммутабельны по имени).
  app.use(
    '/uploads',
    express.static(uploadPath, {
      maxAge: '1y',
      immutable: true,
      // Не даём браузеру «угадывать» тип: загруженный .html/.svg не должен
      // исполняться как активный контент на origin сервера.
      setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
    }),
  );

  const httpServer = createServer(app);
  const io = createSocketServer(httpServer);

  // REST-роуты монтируем после io — им нужен io для room:upsert пушей.
  app.use(createRoutes(io));

  httpServer.listen(env.port, () => {
    console.log(`[talkly] instance ${env.instanceId} listening on :${env.port}`);
  });

  // Graceful shutdown — важно за балансировщиком: даём сокетам закрыться.
  const shutdown = async (signal: string) => {
    console.log(`[talkly] ${signal} received, shutting down…`);
    io.close();
    httpServer.close();
    await disconnectRedis();
    await pool.end();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('[talkly] fatal on bootstrap:', err);
  process.exit(1);
});
