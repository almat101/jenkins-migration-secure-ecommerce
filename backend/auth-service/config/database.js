import { Pool } from "pg";
// import dotenv from "dotenv";

// dotenv.config({ silent: true });
// console.log(process.env);
// console.log(process.cwd());

let pool;

// Lazy initialization pattern - pool is created only on first getPool() call
// Uses singleton pattern to ensure only one pool instance is shared across the application
// Pool creation is centralized here following Single Responsibility Principle
export function getPool() {
  if (!pool) {
    pool = new Pool({
      host: process.env.POSTGRES_HOST_AUTH,
      user: process.env.POSTGRES_USER_AUTH,
      database: process.env.POSTGRES_DB_AUTH,
      password: process.env.POSTGRES_PASSWORD_AUTH,
      port: process.env.POSTGRES_PORT_AUTH,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      maxLifetimeSeconds: 60,
    });
  }
  return pool;
}
