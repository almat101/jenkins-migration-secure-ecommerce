import { Pool } from 'pg'
import dotenv from 'dotenv'


dotenv.config();

let pool = null;

export function getPool () {
  if(!pool) {
    pool = new Pool({
      host: process.env.POSTGRES_HOST_PRODUCTS,
      user:  process.env.POSTGRES_USER_PRODUCTS,
      database: process.env.POSTGRES_DB_PRODUCTS,
      password: process.env.POSTGRES_PASSWORD_PRODUCTS,
      port: process.env.POSTGRES_PORT_PRODUCTS,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      maxLifetimeSeconds: 60
    });
  }
  return pool;
}

/**
 * Gracefully closes the PostgreSQL connection pool.
 * Call this on application shutdown.
 */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('PostgreSQL: Connection pool closed');
  }
}