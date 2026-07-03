import type { TalklyServer, TalklySocket } from '../index.js';
import {
  persistMessage,
  markRead,
  editMessage,
  toggleReaction,
} from '../../services/message.service.js';
import { MessageKind, type Attachment } from '../../../../shared/events.js';
import { env } from '../../config/env.js';

const MAX_BODY = 4000;
const KINDS = new Set<MessageKind>([
  MessageKind.Text, MessageKind.Image, MessageKind.Video, MessageKind.File,
]);

/**
 * Клиентский payload с вложением не доверяем: принимаем только URL, который
 * сервер сам выдал на /upload (в пределах publicUrl/uploads/), поля приводим к
 * ожидаемым типам/длинам. Иначе можно подсунуть произвольный href/спуфинг.
 */
function sanitizeAttachment(input: unknown): Attachment | null {
  if (!input || typeof input !== 'object') return null;
  const a = input as Record<string, unknown>;
  const url = typeof a.url === 'string' ? a.url : '';
  const uploadsPrefix = `${env.publicUrl}/uploads/`;
  if (!url.startsWith(uploadsPrefix) || url.includes('..')) return null;
  return {
    url,
    name: String(a.name ?? 'file').slice(0, 256),
    mime: String(a.mime ?? 'application/octet-stream').slice(0, 128),
    size: Number.isFinite(Number(a.size)) ? Math.max(0, Number(a.size)) : 0,
  };
}

/**
 * Сообщения: отправка (+пересылка), статусы доставки, редактирование, реакции.
 */
export function registerMessageHandlers(_io: TalklyServer, socket: TalklySocket): void {
  socket.on('message:send', async ({ roomId, clientId, body, kind, attachment, forwardedFrom }, ack) => {
    const text = (body ?? '').trim();
    const msgKind = kind && KINDS.has(kind) ? kind : MessageKind.Text;
    const safeAttachment = sanitizeAttachment(attachment);
    if (!text && !safeAttachment) return ack({ ok: false, clientId, error: 'empty message' });
    if (text.length > MAX_BODY) return ack({ ok: false, clientId, error: 'message too long' });
    if (!socket.rooms.has(roomId)) return ack({ ok: false, clientId, error: 'not in room' });

    try {
      await socket.data.ready;
      const message = await persistMessage({
        roomId,
        clientId,
        author: socket.data.user,
        body: text,
        kind: msgKind,
        attachment: safeAttachment,
        forwardedFrom: forwardedFrom ?? null,
      });
      ack({ ok: true, clientId, message });
      socket.to(roomId).emit('message:new', message);
    } catch (err) {
      ack({ ok: false, clientId, error: (err as Error).message });
    }
  });

  socket.on('message:edit', async ({ roomId, messageId, body }, ack) => {
    const text = (body ?? '').trim();
    if (!text) return ack({ ok: false, error: 'empty' });
    if (!socket.rooms.has(roomId)) return ack({ ok: false, error: 'not in room' });
    try {
      await socket.data.ready;
      const updated = await editMessage(roomId, messageId, socket.data.user.id, text);
      if (!updated) return ack({ ok: false, error: 'not found or not author' });
      ack({ ok: true, message: updated });
      socket.to(roomId).emit('message:edited', { roomId, message: updated });
    } catch (err) {
      ack({ ok: false, error: (err as Error).message });
    }
  });

  socket.on('message:react', async ({ roomId, messageId, emoji }) => {
    if (!emoji || !socket.rooms.has(roomId)) return;
    await socket.data.ready;
    const reactions = await toggleReaction(roomId, messageId, socket.data.user.id, emoji.slice(0, 8));
    // Отправляем всем в комнате, включая автора действия (единый источник правды).
    _io.to(roomId).emit('message:reaction', { roomId, messageId, reactions });
  });

  socket.on('message:read', async ({ roomId, messageIds }) => {
    if (!messageIds?.length || !socket.rooms.has(roomId)) return;
    await socket.data.ready;
    await markRead(messageIds, socket.data.user.id);
    socket.to(roomId).emit('message:read', {
      roomId,
      messageIds,
      readerId: socket.data.user.id,
    });
  });
}
