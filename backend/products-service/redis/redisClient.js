import { Redis } from 'ioredis'
import dotenv from 'dotenv'

dotenv.config();

let redisClient = null;

export async function getRedisClient() {
    if(!redisClient) {
        redisClient = new Redis({
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_PORT),
            retryStrategy: (times) => {
                // il consumers continua a riprovare all'infinito
                // if (times > 10) {
                //     console.error("Redis: Max retries reached, giving up");
                //     return null; // Stop retrying
                // }
                const delay = Math.min(times * 500, 5000); // Max 5 seconds
                console.log(`Redis: Retry attempt ${times}, waiting ${delay}ms`);
                return delay;
            },
            maxRetriesPerRequest: 3, // Fail fast on individual commands
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
}

/**
 * Gracefully closes the Redis connection.
 * Call this on application shutdown.
 */
export async function closeRedisClient() {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
        console.log('Redis: Connection closed gracefully');
    }
}