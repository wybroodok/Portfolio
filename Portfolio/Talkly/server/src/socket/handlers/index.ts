import type { TalklyServer, TalklySocket } from '../index.js';
import { registerRoomHandlers } from './room.handler.js';
import { registerMessageHandlers } from './message.handler.js';
import { registerTypingHandlers } from './typing.handler.js';

/** Единая точка подключения всех доменных обработчиков к сокету. */
export function registerHandlers(io: TalklyServer, socket: TalklySocket): void {
  registerRoomHandlers(io, socket);
  registerMessageHandlers(io, socket);
  registerTypingHandlers(io, socket);
}
