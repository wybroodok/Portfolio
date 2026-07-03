import { create } from 'zustand';
import {
  MessageStatus,
  type ChatMessage,
  type RoomId,
  type MessageId,
  type Reactions,
} from '../../../shared/events';

/**
 * Локальный стейт чата. Держит сообщения по комнатам + типизирующих юзеров.
 *
 * Ключевые инварианты:
 *   - сообщения дедуплицируются по clientId (оптимистичное ↔ серверное);
 *   - апдейты статуса не создают новые массивы у неизменившихся комнат
 *     (иначе лишние ре-рендеры при тысячах сообщений).
 */

interface RoomChat {
  messages: ChatMessage[];
  /** Есть ли ещё холодная история выше (для бесконечного скролла). */
  hasMore: boolean;
  /** Имена типизирующих сейчас пользователей. */
  typing: Record<string, string>; // userId -> displayName
}

interface ChatState {
  rooms: Record<RoomId, RoomChat>;
  activeRoomId: RoomId | null;

  setActiveRoom: (roomId: RoomId) => void;
  hydrateRoom: (roomId: RoomId, messages: ChatMessage[]) => void;
  prependHistory: (roomId: RoomId, messages: ChatMessage[], hasMore: boolean) => void;

  /** Оптимистичная вставка (статус Sending) до ответа сервера. */
  addOptimistic: (message: ChatMessage) => void;
  /** Замена оптимистичного сообщения серверным по clientId. */
  reconcile: (roomId: RoomId, clientId: string, server: ChatMessage) => void;
  /** Пометить оптимистичное сообщение как проваленное (для UI-ретрая). */
  markFailed: (roomId: RoomId, clientId: string) => void;
  /** Входящее сообщение от другого пользователя. */
  addIncoming: (message: ChatMessage) => void;

  applyRead: (roomId: RoomId, messageIds: MessageId[], readerId: string) => void;
  applyEdit: (roomId: RoomId, message: ChatMessage) => void;
  applyReaction: (roomId: RoomId, messageId: MessageId, reactions: Reactions) => void;
  setTyping: (roomId: RoomId, userId: string, name: string, isTyping: boolean) => void;
}

/** Иммутабельно заменить одно сообщение в комнате по id. */
function patchMessage(
  rooms: Record<RoomId, RoomChat>,
  roomId: RoomId,
  messageId: MessageId,
  patch: (m: ChatMessage) => ChatMessage,
): Record<RoomId, RoomChat> {
  const room = rooms[roomId];
  if (!room) return rooms;
  return {
    ...rooms,
    [roomId]: {
      ...room,
      messages: room.messages.map((m) => (m.id === messageId ? patch(m) : m)),
    },
  };
}

const emptyRoom = (): RoomChat => ({ messages: [], hasMore: true, typing: {} });

export const useChatStore = create<ChatState>((set) => ({
  rooms: {},
  activeRoomId: null,

  setActiveRoom: (roomId) => set({ activeRoomId: roomId }),

  hydrateRoom: (roomId, messages) =>
    set((s) => ({
      rooms: { ...s.rooms, [roomId]: { ...(s.rooms[roomId] ?? emptyRoom()), messages } },
    })),

  prependHistory: (roomId, older, hasMore) =>
    set((s) => {
      const room = s.rooms[roomId] ?? emptyRoom();
      const seen = new Set(room.messages.map((m) => m.id));
      const fresh = older.filter((m) => !seen.has(m.id));
      return {
        rooms: {
          ...s.rooms,
          [roomId]: { ...room, messages: [...fresh, ...room.messages], hasMore },
        },
      };
    }),

  addOptimistic: (message) =>
    set((s) => {
      const room = s.rooms[message.roomId] ?? emptyRoom();
      return {
        rooms: {
          ...s.rooms,
          [message.roomId]: { ...room, messages: [...room.messages, message] },
        },
      };
    }),

  reconcile: (roomId, clientId, server) =>
    set((s) => {
      const room = s.rooms[roomId];
      if (!room) return s;
      return {
        rooms: {
          ...s.rooms,
          [roomId]: {
            ...room,
            messages: room.messages.map((m) =>
              m.clientId === clientId ? { ...server, status: MessageStatus.Delivered } : m,
            ),
          },
        },
      };
    }),

  markFailed: (roomId, clientId) =>
    set((s) => {
      const room = s.rooms[roomId];
      if (!room) return s;
      return {
        rooms: {
          ...s.rooms,
          [roomId]: {
            ...room,
            messages: room.messages.map((m) =>
              m.clientId === clientId ? { ...m, status: MessageStatus.Sending } : m,
            ),
          },
        },
      };
    }),

  addIncoming: (message) =>
    set((s) => {
      const room = s.rooms[message.roomId] ?? emptyRoom();
      // Идемпотентность: не дублируем, если сообщение уже есть (реконнект-эхо).
      if (room.messages.some((m) => m.id === message.id)) return s;
      return {
        rooms: {
          ...s.rooms,
          [message.roomId]: { ...room, messages: [...room.messages, message] },
        },
      };
    }),

  applyRead: (roomId, messageIds, readerId) =>
    set((s) => {
      const room = s.rooms[roomId];
      if (!room) return s;
      const ids = new Set(messageIds);
      return {
        rooms: {
          ...s.rooms,
          [roomId]: {
            ...room,
            messages: room.messages.map((m) => {
              if (!ids.has(m.id) || m.readBy.includes(readerId)) return m;
              return { ...m, status: MessageStatus.Read, readBy: [...m.readBy, readerId] };
            }),
          },
        },
      };
    }),

  applyEdit: (roomId, message) =>
    set((s) => ({
      rooms: patchMessage(s.rooms, roomId, message.id, (m) => ({
        ...m,
        body: message.body,
        editedAt: message.editedAt,
      })),
    })),

  applyReaction: (roomId, messageId, reactions) =>
    set((s) => ({
      rooms: patchMessage(s.rooms, roomId, messageId, (m) => ({ ...m, reactions })),
    })),

  setTyping: (roomId, userId, name, isTyping) =>
    set((s) => {
      const room = s.rooms[roomId] ?? emptyRoom();
      const typing = { ...room.typing };
      if (isTyping) typing[userId] = name;
      else delete typing[userId];
      return { rooms: { ...s.rooms, [roomId]: { ...room, typing } } };
    }),
}));
