import { pool } from '../db/pool.js';
import { rowToSummary } from './user.service.js';
import type { Room, UserSummary } from '../../../shared/events.js';

interface RoomRow {
  id: string;
  kind: 'dm' | 'group';
  name: string;
  created_by: string | null;
}

/** Собирает Room с участниками одним добором членов. */
async function hydrateRooms(rows: RoomRow[]): Promise<Room[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const { rows: members } = await pool.query(
    `SELECT rm.room_id,
            u.id, u.username, u.display_name, u.avatar_color, u.avatar_url, u.bio, u.last_seen
       FROM room_members rm
       JOIN users u ON u.id = rm.user_id
      WHERE rm.room_id = ANY($1::uuid[])`,
    [ids],
  );
  const byRoom = new Map<string, UserSummary[]>();
  for (const m of members) {
    const list = byRoom.get(m.room_id) ?? [];
    list.push(rowToSummary(m));
    byRoom.set(m.room_id, list);
  }
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    name: r.name,
    createdBy: r.created_by ?? undefined,
    members: byRoom.get(r.id) ?? [],
  }));
}

export async function listRoomsForUser(userId: string): Promise<Room[]> {
  const { rows } = await pool.query<RoomRow>(
    `SELECT r.id, r.kind, r.name, r.created_by
       FROM rooms r
       JOIN room_members rm ON rm.room_id = r.id
      WHERE rm.user_id = $1
      ORDER BY r.created_at`,
    [userId],
  );
  return hydrateRooms(rows);
}

export async function getRoom(roomId: string): Promise<Room | null> {
  const { rows } = await pool.query<RoomRow>(
    'SELECT id, kind, name, created_by FROM rooms WHERE id = $1',
    [roomId],
  );
  if (!rows[0]) return null;
  return (await hydrateRooms(rows))[0]!;
}

export async function isMember(roomId: string, userId: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    'SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2',
    [roomId, userId],
  );
  return (rowCount ?? 0) > 0;
}

export async function getMemberIds(roomId: string): Promise<string[]> {
  const { rows } = await pool.query<{ user_id: string }>(
    'SELECT user_id FROM room_members WHERE room_id = $1',
    [roomId],
  );
  return rows.map((r) => r.user_id);
}

/** Создаёт (или возвращает существующий) DM между двумя пользователями. */
export async function createOrGetDm(a: string, b: string): Promise<Room> {
  // Ищем dm-комнату, где ровно эти двое участников.
  const { rows: existing } = await pool.query<{ id: string }>(
    `SELECT r.id
       FROM rooms r
       JOIN room_members m1 ON m1.room_id = r.id AND m1.user_id = $1
       JOIN room_members m2 ON m2.room_id = r.id AND m2.user_id = $2
      WHERE r.kind = 'dm'
      LIMIT 1`,
    [a, b],
  );
  if (existing[0]) return (await getRoom(existing[0].id))!;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO rooms (kind, name, created_by) VALUES ('dm', '', $1) RETURNING id`,
      [a],
    );
    const roomId = rows[0]!.id;
    await client.query(
      `INSERT INTO room_members (room_id, user_id) VALUES ($1, $2), ($1, $3)`,
      [roomId, a, b],
    );
    await client.query('COMMIT');
    return (await getRoom(roomId))!;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

/** Создаёт группу с создателем и переданными участниками. */
export async function createGroup(
  creatorId: string,
  name: string,
  memberIds: string[],
): Promise<Room> {
  const uniqueMembers = Array.from(new Set([creatorId, ...memberIds]));
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO rooms (kind, name, created_by) VALUES ('group', $1, $2) RETURNING id`,
      [name.trim() || 'New group', creatorId],
    );
    const roomId = rows[0]!.id;
    for (const uid of uniqueMembers) {
      await client.query(
        `INSERT INTO room_members (room_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [roomId, uid],
      );
    }
    await client.query('COMMIT');
    return (await getRoom(roomId))!;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

/** Добавляет участника в группу; возвращает обновлённую комнату. */
export async function addMember(roomId: string, userId: string): Promise<Room> {
  await pool.query(
    `INSERT INTO room_members (room_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [roomId, userId],
  );
  return (await getRoom(roomId))!;
}
