import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }
  return redis;
}