import { randomUUID } from 'node:crypto';
import { dataClient, keys } from '../config/redis.js';
import { env } from '../config/env.js';
import { pool } from '../db/pool.js';
import {
  MessageKind,
  MessageStatus,
  type Attachment,
  type ChatMessage,
  type Reactions,
  type RoomId,
  type UserSummary,
} from '../../../shared/events.js';

/**
 * Двухуровневая стратегия хранения:
 *   1. Горячий хвост (последние ROOM_CACHE_SIZE сообщений) — Redis ZSET.
 *   2. Холодная история — PostgreSQL, keyset-пагинация по курсору `before`.
 */

interface PersistArgs {
  roomId: RoomId;
  clientId: string;
  author: UserSummary;
  body: string;
  kind: MessageKind;
  attachment?: Attachment | null;
  forwardedFrom?: string | null;
}

export async function persistMessage(args: PersistArgs): Promise<ChatMessage> {
  const { roomId, clientId, author, body, kind, attachment, forwardedFrom } = args;

  const { rows } = await pool.query<{ id: string; created_at: Date }>(
    `INSERT INTO messages
       (id, client_id, room_id, author_id, body, kind,
        attachment_url, attachment_name, attachment_mime, attachment_size, forwarded_from)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT (room_id, author_id, client_id)
     DO UPDATE SET body = messages.body
     RETURNING id, created_at`,
    [
      randomUUID(), clientId, roomId, author.id, body, kind,
      attachment?.url ?? null, attachment?.name ?? null,
      attachment?.mime ?? null, attachment?.size ?? null, forwardedFrom ?? null,
    ],
  );

  const row = rows[0];
  if (!row) throw new Error('persistMessage: insert returned no row');

  const message: ChatMessage = {
    id: row.id,
    clientId,
    roomId,
    author,
    body,
    kind,
    attachment: attachment ?? null,
    status: MessageStatus.Delivered,
    readBy: [],
    reactions: {},
    editedAt: null,
    forwardedFrom: forwardedFrom ?? null,
    createdAt: row.created_at.getTime(),
  };

  await pushToHotCache(message);
  return message;
}

async function pushToHotCache(message: ChatMessage): Promise<void> {
  const key = keys.roomMessages(message.roomId);
  const multi = dataClient.multi();
  multi.zAdd(key, { score: message.createdAt, value: JSON.stringify(message) });
  multi.zRemRangeByRank(key, 0, -(env.roomCacheSize + 1));
  await multi.exec();
}

/**
 * Точечно обновляет сообщение в горячем кэше (для edit/react).
 * Кэш мал (≤50), поэтому находим member по id, заменяем на том же score.
 */
async function updateCachedMessage(
  roomId: RoomId,
  messageId: string,
  mutate: (m: ChatMessage) => ChatMessage,
): Promise<void> {
  const key = keys.roomMessages(roomId);
  const entries = await dataClient.zRangeWithScores(key, 0, -1);
  for (const { value, score } of entries) {
    const msg = JSON.parse(value) as ChatMessage;
    if (msg.id !== messageId) continue;
    const next = JSON.stringify(mutate(msg));
    const multi = dataClient.multi();
    multi.zRem(key, value);
    multi.zAdd(key, { score, value: next });
    await multi.exec();
    return;
  }
}

export async function getHotMessages(roomId: RoomId): Promise<ChatMessage[]> {
  const raw = await dataClient.zRange(keys.roomMessages(roomId), 0, -1);
  return raw.map((s) => JSON.parse(s) as ChatMessage);
}

function buildAttachment(row: {
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_mime: string | null;
  attachment_size: string | null;
}): Attachment | null {
  if (!row.attachment_url) return null;
  return {
    url: row.attachment_url,
    name: row.attachment_name ?? 'file',
    mime: row.attachment_mime ?? 'application/octet-stream',
    size: Number(row.attachment_size ?? 0),
  };
}

export async function getHistoryPage(
  roomId: RoomId,
  before: number,
  limit = 50,
): Promise<{ messages: ChatMessage[]; hasMore: boolean }> {
  const { rows } = await pool.query(
    `SELECT m.id, m.client_id, m.body, m.kind, m.created_at, m.edited_at,
            m.forwarded_from, m.reactions,
            m.attachment_url, m.attachment_name, m.attachment_mime, m.attachment_size,
            u.id AS author_id, u.username, u.display_name, u.avatar_color, u.avatar_url,
            COALESCE(array_agg(r.reader_id) FILTER (WHERE r.reader_id IS NOT NULL), '{}') AS read_by
       FROM messages m
       JOIN users u ON u.id = m.author_id
       LEFT JOIN message_reads r ON r.message_id = m.id
      WHERE m.room_id = $1 AND m.created_at < to_timestamp($2 / 1000.0)
      GROUP BY m.id, u.id
      ORDER BY m.created_at DESC
      LIMIT $3`,
    [roomId, before, limit + 1],
  );

  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit).reverse();

  const messages: ChatMessage[] = page.map((row) => ({
    id: row.id,
    clientId: row.client_id,
    roomId,
    author: {
      id: row.author_id,
      username: row.username,
      displayName: row.display_name,
      avatarColor: row.avatar_color,
      avatarUrl: row.avatar_url,
    },
    body: row.body,
    kind: row.kind as MessageKind,
    attachment: buildAttachment(row),
    status: MessageStatus.Delivered,
    readBy: row.read_by,
    reactions: (row.reactions ?? {}) as Reactions,
    editedAt: row.edited_at ? new Date(row.edited_at).getTime() : null,
    forwardedFrom: row.forwarded_from,
    createdAt: new Date(row.created_at).getTime(),
  }));

  return { messages, hasMore };
}

export async function markRead(messageIds: string[], readerId: string): Promise<void> {
  if (messageIds.length === 0) return;
  await pool.query(
    `INSERT INTO message_reads (message_id, reader_id)
     SELECT unnest($1::uuid[]), $2
     ON CONFLICT DO NOTHING`,
    [messageIds, readerId],
  );
}

/** Редактирование текста (только автором). Возвращает обновлённое сообщение. */
export async function editMessage(
  roomId: RoomId,
  messageId: string,
  authorId: string,
  body: string,
): Promise<ChatMessage | null> {
  const { rows } = await pool.query<{ edited_at: Date }>(
    `UPDATE messages SET body = $4, edited_at = now()
      WHERE id = $1 AND room_id = $2 AND author_id = $3
      RETURNING edited_at`,
    [messageId, roomId, authorId, body],
  );
  if (!rows[0]) return null;

  const editedAt = rows[0].edited_at.getTime();
  let updated: ChatMessage | null = null;
  await updateCachedMessage(roomId, messageId, (m) => {
    updated = { ...m, body, editedAt };
    return updated;
  });
  // Если не было в кэше — собираем из БД-независимо (кэш мог вытеснить).
  return updated ?? (await fetchOne(roomId, messageId));
}

/** Тоггл реакции пользователя. Возвращает актуальный набор реакций. */
export async function toggleReaction(
  roomId: RoomId,
  messageId: string,
  userId: string,
  emoji: string,
): Promise<Reactions> {
  const { rows } = await pool.query<{ reactions: Reactions }>(
    'SELECT reactions FROM messages WHERE id = $1 AND room_id = $2',
    [messageId, roomId],
  );
  if (!rows[0]) return {};
  const reactions: Reactions = rows[0].reactions ?? {};
  const list = new Set(reactions[emoji] ?? []);
  if (list.has(userId)) list.delete(userId);
  else list.add(userId);
  if (list.size === 0) delete reactions[emoji];
  else reactions[emoji] = [...list];

  await pool.query('UPDATE messages SET reactions = $3 WHERE id = $1 AND room_id = $2', [
    messageId, roomId, JSON.stringify(reactions),
  ]);
  await updateCachedMessage(roomId, messageId, (m) => ({ ...m, reactions }));
  return reactions;
}

/** Добор одного сообщения из БД (когда кэш его уже вытеснил). */
async function fetchOne(roomId: RoomId, messageId: string): Promise<ChatMessage | null> {
  const { messages } = await getHistoryPage(roomId, Date.now() + 1, 1000);
  return messages.find((m) => m.id === messageId) ?? null;
}
