import pg from 'pg';
import { config } from './config.js';

export const pool = new pg.Pool({ connectionString: config.databaseUrl });

export async function query(text, params = []) {
  const started = Date.now();
  const result = await pool.query(text, params);
  if (Date.now() - started > 500) {
    console.warn('Slow query', { ms: Date.now() - started, text });
  }
  return result;
}
