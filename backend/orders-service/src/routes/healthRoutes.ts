import type { FastifyInstance } from 'fastify';
import { db } from "../db/index.js";
import { sql } from "drizzle-orm";
import { getRedisClient } from '../redis/redisClient.js'; 
import { rejects } from 'assert/strict';

export default function healthRoutes(server:FastifyInstance) {
  
  // LIVENESS PROBE: Is the process alive?
  // Used by Docker/K8s to know if container should be restarted
  server.get('/', { logLevel: 'silent' }, (request, reply) => {
    reply.status(200).send({ status: 'ok' });
  });

  // READINESS PROBE: Can the service handle requests?
  // Checks external dependencies (DB, Redis)
  server.get('/ready', { logLevel: 'silent'},  async (request, reply) => {
    const health = {
      status: 'ready',
      postgres: 'ok',
      redis: 'ok'
    };

    try {
      await db.execute(sql`SELECT 1`);
    } catch (error) {
      health.status = 'not ready';
      health.postgres = error instanceof Error ? error.message : 'error';
    }

    try {
      const redis = await getRedisClient();
      await Promise.race([
        redis.ping(),
         new Promise((_, reject) => setTimeout(() => reject(new Error("Redis ping timeout")), 2000))
      ]);
    } catch (error) {
      health.status = 'not ready';
      health.redis = error instanceof Error ? error.message : 'error';
    }
  
    const statusCode = health.status === 'ready' ? 200 : 503;
    reply.status(statusCode).send(health);
  });
}

// } server.get("/ping", { logLevel: 'silent' }, async (request, reply) => {
//   reply.type("application/json").code(200);
//   return 'pong\n';
// });
