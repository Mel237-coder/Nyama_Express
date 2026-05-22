import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

export interface RateLimitOptions {
  keyPrefix: string;
  maxRequests: number;
  windowMs: number;
}

export function rateLimitMiddleware(options: RateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `${options.keyPrefix}:${req.ip}`;
    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.pexpire(key, options.windowMs);
      }
      if (current > options.maxRequests) {
        return res.status(429).json({ error: 'Too many requests' });
      }
      next();
    } catch (err) {
      // If Redis is down, fail open to avoid locking out all users
      console.error('[RateLimit] Redis error, failing open:', err);
      next();
    }
  };
}
