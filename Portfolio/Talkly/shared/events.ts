/**
 * Talkly — единый контракт Socket.io событий.
 *
 * Импортируется и клиентом, и сервером, поэтому типы соединения
 * (ServerToClientEvents / ClientToServerEvents) физически не могут
 * разойтись. Любое изменение payload'а ломает компиляцию с обеих сторон —
 * это осознанная защита от «тихого» дрейфа API реального времени.
 */

/** Три состояния доставки сообщения (killer-feature: Delivery Statuses). */
export enum MessageStatus {
  Sending = 'sending',
  Delivered = 'delivered',
  Read = 'read',
}

/** Тип содержимого сообщения. */
export enum MessageKind {
  Text = 'text',
  Image = 'image',
  Video = 'video',
  File = 'file',
}

export type UserId = string;
export type RoomId = string;
export type MessageId = string;

export interface UserSummary {
  id: UserId;
  username: string;
  displayName: string;
  avatarColor: string;
  /** URL загруженного фото-аватара; null — рисуем инициалы на цвете. */
  avatarUrl?: string | null;
}

export interface UserProfile extends UserSummary {
  bio?: string | null;
  /** epoch ms последнего онлайна; null — сейчас в сети. */
  lastSeen?: number | null;
}

/** Метаданные вложения. Файл уже загружен по REST, тут только ссылка. */
export interface Attachment {
  url: string;
  name: string;
  mime: string;
  size: number;
}

/** Реакции: эмодзи → список id поставивших. */
export type Reactions = Record<string, UserId[]>;

export interface ChatMessage {
  id: MessageId;
  clientId: string;
  roomId: RoomId;
  author: UserSummary;
  body: string;
  kind: MessageKind;
  attachment?: Attachment | null;
  status: MessageStatus;
  readBy: UserId[];
  createdAt: number;
  /** epoch ms последнего редактирования; null — не редактировалось. */
  editedAt?: number | null;
  reactions?: Reactions;
  /** Имя автора оригинала, если сообщение переслано. */
  forwardedFrom?: string | null;
}

export type RoomKind = 'dm' | 'group';

export interface Room {
  id: RoomId;
  kind: RoomKind;
  /** Имя группы; для DM клиент подставляет имя собеседника. */
  name: string;
  members: UserSummary[];
  createdBy?: UserId;
}

export type PresenceState = 'online' | 'offline';

/* ------------------------------------------------------------------ */
/* Payload'ы событий                                                   */
/* ------------------------------------------------------------------ */

export interface SendMessagePayload {
  roomId: RoomId;
  clientId: string;
  body: string;
  kind?: MessageKind;
  attachment?: Attachment | null;
  /** Имя автора оригинала при пересылке. */
  forwardedFrom?: string | null;
}

export interface EditMessagePayload {
  roomId: RoomId;
  messageId: MessageId;
  body: string;
}

export interface EditMessageAck {
  ok: boolean;
  message?: ChatMessage;
  error?: string;
}

export interface ReactPayload {
  roomId: RoomId;
  messageId: MessageId;
  emoji: string;
}

export interface MessageEditedBroadcast {
  roomId: RoomId;
  message: ChatMessage;
}

export interface ReactionBroadcast {
  roomId: RoomId;
  messageId: MessageId;
  reactions: Reactions;
}

export interface SendMessageAck {
  ok: boolean;
  clientId: string;
  message?: ChatMessage;
  error?: string;
}

export interface JoinRoomPayload {
  roomId: RoomId;
}

export interface JoinRoomAck {
  ok: boolean;
  messages: ChatMessage[];
  error?: string;
}

export interface HistoryPagePayload {
  roomId: RoomId;
  before: number;
  limit?: number;
}

export interface HistoryPageAck {
  ok: boolean;
  messages: ChatMessage[];
  hasMore: boolean;
  error?: string;
}

export interface TypingPayload {
  roomId: RoomId;
}

export interface TypingBroadcast {
  roomId: RoomId;
  user: UserSummary;
  isTyping: boolean;
}

export interface MessageReadPayload {
  roomId: RoomId;
  messageIds: MessageId[];
}

export interface MessageReadBroadcast {
  roomId: RoomId;
  messageIds: MessageId[];
  readerId: UserId;
}

export interface PresenceBroadcast {
  userId: UserId;
  state: PresenceState;
  /** epoch ms последнего онлайна (для «был(а) недавно/давно»). */
  lastSeen?: number | null;
}

/* ------------------------------------------------------------------ */
/* Типизированные карты событий Socket.io                              */
/* ------------------------------------------------------------------ */

export interface ServerToClientEvents {
  'message:new': (message: ChatMessage) => void;
  'message:read': (payload: MessageReadBroadcast) => void;
  'message:edited': (payload: MessageEditedBroadcast) => void;
  'message:reaction': (payload: ReactionBroadcast) => void;
  'typing:update': (payload: TypingBroadcast) => void;
  'presence:update': (payload: PresenceBroadcast) => void;
  'session:ready': (user: UserSummary) => void;
  /** Новая/обновлённая комната пушится участнику (создан DM/группа, добавлен участник). */
  'room:upsert': (room: Room) => void;
}

export interface ClientToServerEvents {
  'room:join': (payload: JoinRoomPayload, ack: (res: JoinRoomAck) => void) => void;
  'room:leave': (payload: JoinRoomPayload) => void;
  'message:send': (payload: SendMessagePayload, ack: (res: SendMessageAck) => void) => void;
  'message:edit': (payload: EditMessagePayload, ack: (res: EditMessageAck) => void) => void;
  'message:react': (payload: ReactPayload) => void;
  'message:read': (payload: MessageReadPayload) => void;
  'history:page': (payload: HistoryPagePayload, ack: (res: HistoryPageAck) => void) => void;
  'typing:start': (payload: TypingPayload) => void;
  'typing:stop': (payload: TypingPayload) => void;
}

export interface SocketData {
  user: UserSummary;
  sessionId: string;
  /** Server-only: резолвится после регистрации сессии/presence (см. socket/index.ts). */
  ready?: Promise<void>;
}

export interface InterServerEvents {
  ping: () => void;
}
