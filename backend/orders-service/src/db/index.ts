import 'dotenv/config';
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});
export const db = drizzle({ client: pool });

/**
 * Gracefully closes the PostgreSQL connection pool.
 * Call this on application shutdown.
 */
export async function closeDbPool(): Promise<void> {
  await pool.end();
  console.log('PostgreSQL: Connection pool closed');
}