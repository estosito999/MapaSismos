import { Pool } from 'pg';

// Reuse the pool across hot reloads in development and initialize it only when needed.
const globalForDb = globalThis as typeof globalThis & { seismicPool?: Pool };

export function getPool(): Pool {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  if (!globalForDb.seismicPool) {
    globalForDb.seismicPool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
  }
  return globalForDb.seismicPool;
}
