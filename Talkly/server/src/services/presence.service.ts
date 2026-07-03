import { dataClient, keys } from '../config/redis.js';
import { touchLastSeen } from './user.service.js';
import type { PresenceState, UserId } from '../../../shared/events.js';

/**
 * Presence с подсчётом сокетов (мультивкладки).
 * online, пока есть хотя бы один живой сокет. Переход 1→0 фиксирует last_seen
 * в БД — от него клиент считает «в сети / был(а) недавно / был(а) давно».
 */

export interface PresenceTransition {
  state: PresenceState;
  changed: boolean;
  lastSeen?: number | null;
}

export async function addSocket(userId: UserId, socketId: string): Promise<PresenceTransition> {
  const setKey = keys.userSockets(userId);
  const added = await dataClient.sAdd(setKey, socketId);
  const total = await dataClient.sCard(setKey);
  const becameOnline = total === 1 && added === 1;
  if (becameOnline) await dataClient.set(keys.userPresence(userId), 'online');
  return { state: 'online', changed: becameOnline, lastSeen: null };
}

export async function removeSocket(userId: UserId, socketId: string): Promise<PresenceTransition> {
  const setKey = keys.userSockets(userId);
  await dataClient.sRem(setKey, socketId);
  const total = await dataClient.sCard(setKey);
  if (total === 0) {
    await dataClient.set(keys.userPresence(userId), 'offline');
    const lastSeen = await touchLastSeen(userId);
    return { state: 'offline', changed: true, lastSeen };
  }
  return { state: 'online', changed: false };
}

export async function getPresence(userId: UserId): Promise<PresenceState> {
  return ((await dataClient.get(keys.userPresence(userId))) as PresenceState) ?? 'offline';
}
