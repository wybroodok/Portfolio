# Talkly — Corporate Real-Time Messenger

Cyberpunk-Corporate корпоративный мессенджер с мгновенным откликом, рассчитанный
на тысячи стабильных одновременных соединений и горизонтальное масштабирование.

## Стек

| Слой       | Технологии |
|------------|-----------|
| Frontend   | React (Vite) · TypeScript · TailwindCSS · Zustand · Framer Motion · socket.io-client |
| Backend    | Node.js · Express · TypeScript · Socket.io · Redis (Pub/Sub + cache) |
| Хранилище  | PostgreSQL (история, профили) · Redis (горячий кэш, сессии, presence) |
| Инфра      | Docker Compose · Nginx (sticky LB) · Redis Adapter (cross-instance) |

## Архитектура

```
                       ┌──────────── Nginx (ip_hash, WS upgrade) ────────────┐
                       │                                                     │
   React client ──WS──►│  api1 (Socket.io) ◄──┐        ┌──► api2 (Socket.io) │
                       └──────────────────────┼────────┼─────────────────────┘
                                              │        │
                                     ┌────────▼────────▼────────┐
                                     │   Redis  (Pub/Sub adapter │
                                     │   + hot cache + sessions) │
                                     └────────────┬─────────────┘
                                                  │  (пагинация холодной истории)
                                        ┌─────────▼─────────┐
                                        │    PostgreSQL     │
                                        └───────────────────┘
```

**Единый контракт событий** (`shared/events.ts`) импортируют обе стороны —
типы соединения физически не могут разойтись.

### Ключевые архитектурные решения

- **Горизонтальное масштабирование** — `@socket.io/redis-adapter`: broadcast в
  комнату ретранслируется между всеми инстансами (`server/src/socket/index.ts`).
- **Двухуровневый кэш** — вход в комнату отдаёт последние 50 сообщений из Redis
  ZSET мгновенно; скролл вверх триггерит keyset-пагинацию в PostgreSQL
  (`server/src/services/message.service.ts`).
- **Синхронизация сессий** — активная сокет-сессия хранится в Redis KV; новый
  коннект отключает устаревший, предотвращая дубли при перезагрузке страницы
  (`server/src/services/session.service.ts`).
- **Presence с подсчётом сокетов** — мультивкладки не ломают статус; broadcast
  только на переходах online↔offline (`server/src/services/presence.service.ts`).

### Killer-features (где смотреть код)

| Фича | Клиент | Сервер |
|------|--------|--------|
| `User is typing…` (debounce + авто-затухание 3 c) | `hooks/useTyping.ts` | `handlers/typing.handler.ts` |
| Delivery Statuses (Sending → Delivered → Read) | `hooks/useSendMessage.ts`, `MessageBubble.tsx` | `handlers/message.handler.ts` |
| Read-receipts через IntersectionObserver (батчинг) | `hooks/useReadReceipts.ts` | `handlers/message.handler.ts` |
| Комнаты / каналы / DM (join·leave, изоляция) | `ChatPanel.tsx` | `handlers/room.handler.ts` |
| Resilience (reconnect без потери стейта, оффлайн-баннер) | `SocketManager.ts`, `ConnectionBanner.tsx` | `connectionStateRecovery` |

## Запуск

### 1. Инфраструктура (Postgres + Redis + 2 инстанса за Nginx)

```bash
docker compose up --build
# API доступен на http://localhost:4000 (балансируется на api1/api2)
```

Для локальной разработки без Docker поднимите Redis и Postgres, примените
`server/src/db/schema.sql`, затем:

```bash
cd server && cp .env.example .env && npm install && npm run dev
```

### 2. Клиент

```bash
cd client && npm install && npm run dev   # http://localhost:5173
```

### 3. Тестовый вход

```bash
cd server && node scripts/make-token.mjs "Ada Lovelace"
# скопируйте выведенную строку localStorage.setItem(...) в консоль браузера, F5
```

Откройте два браузера с разными токенами — увидите typing-индикатор,
статусы доставки/прочтения и presence в реальном времени.

## Оптимизация трафика

- typing-события троттлятся (не чаще 1/1.5 c) и гаснут авто-таймером;
- read-receipts батчатся (один emit на пачку прочитанного при скролле);
- `perMessageDeflate` сжимает только payload'ы > 1 КБ;
- транспорт форсирован в `websocket` (без long-polling оверхеда).
```
