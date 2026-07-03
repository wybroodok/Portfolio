import { pool } from '../db/pool.js';
import type { PoolClient } from 'pg';
import type { UserProfile, UserSummary } from '../../../shared/events.js';

const LOUNGE_ID = '00000000-0000-0000-0000-000000000001';

/** Детерминированный цвет аватара от строки — стабилен между сессиями. */
export function avatarColorFor(seed: string): string {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return `hsl(${hash % 360} 70% 60%)`;
}

interface UserRow {
  id: string;
  username: string;
  display_name: string;
  avatar_color: string;
  avatar_url: string | null;
  bio: string | null;
  last_seen: Date | null;
}

export function rowToSummary(r: UserRow): UserSummary {
  return {
    id: r.id,
    username: r.username,
    displayName: r.display_name,
    avatarColor: r.avatar_color,
    avatarUrl: r.avatar_url,
  };
}

export function rowToProfile(r: UserRow): UserProfile {
  return {
    ...rowToSummary(r),
    bio: r.bio,
    lastSeen: r.last_seen ? r.last_seen.getTime() : null,
  };
}

const SELECT =
  'id, username, display_name, avatar_color, avatar_url, bio, last_seen';

export class UsernameTakenError extends Error {}

/** Регистрация: создаёт пользователя и добавляет его в дефолтную группу. */
export async function registerUser(
  username: string,
  displayName: string,
): Promise<UserProfile> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let row: UserRow;
    try {
      const res = await client.query<UserRow>(
        `INSERT INTO users (username, display_name, avatar_color)
         VALUES ($1, $2, $3)
         RETURNING ${SELECT}`,
        [username, displayName, avatarColorFor(username)],
      );
      row = res.rows[0]!;
    } catch (e) {
      if ((e as { code?: string }).code === '23505') {
        throw new UsernameTakenError('username already taken');
      }
      throw e;
    }
    await addToLounge(client, row.id);
    await client.query('COMMIT');
    return rowToProfile(row);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function addToLounge(client: PoolClient, userId: string): Promise<void> {
  await client.query(
    `INSERT INTO room_members (room_id, user_id) VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [LOUNGE_ID, userId],
  );
}

export async function getUserById(id: string): Promise<UserProfile | null> {
  const { rows } = await pool.query<UserRow>(
    `SELECT ${SELECT} FROM users WHERE id = $1`,
    [id],
  );
  return rows[0] ? rowToProfile(rows[0]) : null;
}

export async function getUserByUsername(username: string): Promise<UserProfile | null> {
  const { rows } = await pool.query<UserRow>(
    `SELECT ${SELECT} FROM users WHERE lower(username) = lower($1)`,
    [username],
  );
  return rows[0] ? rowToProfile(rows[0]) : null;
}

/** Поиск по username/имени (кроме себя), для строки поиска. */
export async function searchUsers(query: string, excludeId: string): Promise<UserSummary[]> {
  const q = `%${query.trim()}%`;
  const { rows } = await pool.query<UserRow>(
    `SELECT ${SELECT} FROM users
      WHERE id <> $1 AND (username ILIKE $2 OR display_name ILIKE $2)
      ORDER BY username
      LIMIT 20`,
    [excludeId, q],
  );
  return rows.map(rowToSummary);
}

export async function updateProfile(
  id: string,
  patch: { displayName?: string; bio?: string; avatarColor?: string; avatarUrl?: string | null },
): Promise<UserProfile | null> {
  const { rows } = await pool.query<UserRow>(
    `UPDATE users SET
       display_name = COALESCE($2, display_name),
       bio          = COALESCE($3, bio),
       avatar_color = COALESCE($4, avatar_color),
       avatar_url   = COALESCE($5, avatar_url)
     WHERE id = $1
     RETURNING ${SELECT}`,
    [id, patch.displayName ?? null, patch.bio ?? null, patch.avatarColor ?? null, patch.avatarUrl ?? null],
  );
  return rows[0] ? rowToProfile(rows[0]) : null;
}

/** Фиксирует момент ухода в оффлайн для «был(а) недавно/давно». */
export async function touchLastSeen(id: string): Promise<number> {
  const now = new Date();
  await pool.query('UPDATE users SET last_seen = $2 WHERE id = $1', [id, now]);
  return now.getTime();
}
