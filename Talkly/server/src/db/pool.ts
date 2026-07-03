import { Pool } from 'pg';
import { env } from '../config/env.js';

/**
 * PostgreSQL — источник истины для истории и профилей.
 * Redis держит только горячий хвост; всё, что старше кэша, живёт здесь.
 */
export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => console.error('[pg] idle client error:', err.message));

export async function assertDbConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    console.log('[pg] connected');
  } finally {
    client.release();
  }
}
