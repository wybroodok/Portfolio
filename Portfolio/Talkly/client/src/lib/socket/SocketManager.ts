import { io, type Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  JoinRoomAck,
  SendMessageAck,
  HistoryPageAck,
  EditMessageAck,
  Attachment,
  MessageKind,
} from '../../../../shared/events';

type TalklyClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * Единая точка владения соединением.
 *
 * Почему синглтон, а не сокет в React-компоненте:
 *   - соединение переживает ремоунты/навигацию, не пересоздаётся на ре-рендер;
 *   - реконнект и восстановление стейта не завязаны на жизненный цикл UI;
 *   - обёртки emit'ов промисифицируют ack-колбэки (нужно для delivery-статусов).
 *
 * Компоненты не трогают socket напрямую — только через методы менеджера и
 * подписки. Это держит сетевую логику в одном месте и облегчает тестирование.
 */
class SocketManager {
  private socket: TalklyClientSocket | null = null;
  private token: string | null = null;

  /** Комнаты, в которых мы «должны» находиться — переджойн после реконнекта. */
  private readonly desiredRooms = new Set<string>();

  connect(token: string): TalklyClientSocket {
    if (this.socket && this.token === token) return this.socket;
    this.token = token;

    this.socket = io(import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:4000', {
      auth: { token },
      transports: ['websocket'],
      // Экспоненциальный бэкофф со случайным джиттером — не «громим» сервер
      // синхронным штормом реконнектов после сетевого сбоя.
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5_000,
      randomizationFactor: 0.5,
    });

    // После разрыва Socket.io сам не возвращает нас в комнаты — делаем это сами.
    this.socket.on('connect', () => {
      for (const roomId of this.desiredRooms) {
        this.socket?.emit('room:join', { roomId }, () => void 0);
      }
    });

    return this.socket;
  }

  get instance(): TalklyClientSocket {
    if (!this.socket) throw new Error('SocketManager: connect() must be called first');
    return this.socket;
  }

  /** Присоединиться к комнате и получить горячий кэш (ack). */
  joinRoom(roomId: string): Promise<JoinRoomAck> {
    this.desiredRooms.add(roomId);
    return new Promise((resolve) => {
      this.instance.emit('room:join', { roomId }, resolve);
    });
  }

  leaveRoom(roomId: string): void {
    this.desiredRooms.delete(roomId);
    this.instance.emit('room:leave', { roomId });
  }

  /** Отправка с промисифицированным ack — источник статуса Delivered. */
  sendMessage(
    roomId: string,
    clientId: string,
    body: string,
    media?: { attachment: Attachment; kind: MessageKind },
    forwardedFrom?: string | null,
  ): Promise<SendMessageAck> {
    return new Promise((resolve) => {
      this.instance.emit(
        'message:send',
        { roomId, clientId, body, kind: media?.kind, attachment: media?.attachment, forwardedFrom },
        resolve,
      );
    });
  }

  editMessage(roomId: string, messageId: string, body: string): Promise<EditMessageAck> {
    return new Promise((resolve) => {
      this.instance.emit('message:edit', { roomId, messageId, body }, resolve);
    });
  }

  reactMessage(roomId: string, messageId: string, emoji: string): void {
    this.instance.emit('message:react', { roomId, messageId, emoji });
  }

  loadHistory(roomId: string, before: number, limit = 50): Promise<HistoryPageAck> {
    return new Promise((resolve) => {
      this.instance.emit('history:page', { roomId, before, limit }, resolve);
    });
  }

  markRead(roomId: string, messageIds: string[]): void {
    if (messageIds.length) this.instance.emit('message:read', { roomId, messageIds });
  }

  startTyping(roomId: string): void {
    this.instance.emit('typing:start', { roomId });
  }

  stopTyping(roomId: string): void {
    this.instance.emit('typing:stop', { roomId });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.token = null;
    this.desiredRooms.clear();
  }
}

/** Один экземпляр на всё приложение. */
export const socketManager = new SocketManager();
