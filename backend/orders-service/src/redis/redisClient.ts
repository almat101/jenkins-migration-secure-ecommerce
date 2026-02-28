import { Redis } from "ioredis"
import dotenv from "dotenv";

dotenv.config({ debug: false});

let redisClient: Redis | null = null;

export async function getRedisClient(): Promise<Redis> {
    if(!redisClient) {
        redisClient = new Redis({
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_PORT),
            retryStrategy: (times) => {
                // if( times > 10 ) {
                //     console.error("Redis: Max retries reached.");
                //     return null;
                // }
                const delay = Math.min(times * 500, 5000);
                console.log(`Redis: Retry attempt ${times}, waiting ${delay}ms`);
                return delay;
            },
            maxRetriesPerRequest: 3,
        });

        // Handle connection events (prevents "Unhandled error event")
        redisClient.on('error', (err) => {
            console.error('Redis connection error:', err.message);
        });

        redisClient.on('connect', () => {
            console.log('Redis: Connected');
        });

        redisClient.on('close', () => {
            console.log('Redis: Connection closed');
        });

        redisClient.on('reconnecting', () => {
            console.log('Redis: Reconnecting...');
        });
    }
return redisClient;
};

/**
 * Gracefully closes the Redis connection.
 * Call this on application shutdown.
 */
export async function closeRedisClient(): Promise<void> {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
        console.log('Redis: Connection closed gracefully');
    }
};