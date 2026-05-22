import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { rateLimitMiddleware } from '../middleware/rateLimit';

interface MockRedisStore {
  mockIncr: jest.Mock;
  mockPexpire: jest.Mock;
}

jest.mock('ioredis', () => {
  const mockIncr = jest.fn();
  const mockPexpire = jest.fn();
  const store: MockRedisStore = { mockIncr, mockPexpire };
  (globalThis as typeof globalThis & { __mockRedis: MockRedisStore }).__mockRedis = store;
  return jest.fn().mockImplementation(() => ({
    incr: (...args: unknown[]) => mockIncr(...args),
    pexpire: (...args: unknown[]) => mockPexpire(...args),
    on: jest.fn(),
  }));
});

const { mockIncr, mockPexpire } = (globalThis as typeof globalThis & { __mockRedis: MockRedisStore }).__mockRedis;

const setIp = (ip: string) => (req: Request, _res: Response, next: NextFunction) => {
  Object.defineProperty(req, 'ip', { value: ip });
  next();
};

describe('rateLimitMiddleware', () => {
  beforeEach(() => {
    mockIncr.mockReset();
    mockPexpire.mockReset();
  });

  it('should block requests exceeding the limit', async () => {
    mockIncr
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(3);
    mockPexpire.mockResolvedValue(1);

    const app = express();
    app.use(rateLimitMiddleware({ keyPrefix: 'test', maxRequests: 2, windowMs: 60_000 }));
    app.get('/test', (_req, res) => res.json({ ok: true }));

    await request(app).get('/test').expect(200);
    await request(app).get('/test').expect(200);
    const res = await request(app).get('/test').expect(429);
    expect(res.body.error).toBe('Too many requests');
    expect(res.headers['retry-after']).toBe('60');
  });

  it('should call pexpire only on the first request', async () => {
    mockIncr
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2);
    mockPexpire.mockResolvedValue(1);

    const app = express();
    app.use(rateLimitMiddleware({ keyPrefix: 'pexpire-test', maxRequests: 2, windowMs: 60_000 }));
    app.get('/test', (_req, res) => res.json({ ok: true }));

    await request(app).get('/test').expect(200);
    expect(mockPexpire).toHaveBeenCalledTimes(1);
    expect(mockPexpire).toHaveBeenCalledWith('pexpire-test:::ffff:127.0.0.1', 60_000);

    await request(app).get('/test').expect(200);
    expect(mockPexpire).toHaveBeenCalledTimes(1);
  });

  it('should fail open when Redis throws an error', async () => {
    mockIncr.mockRejectedValue(new Error('Redis connection lost'));

    const app = express();
    app.use(rateLimitMiddleware({ keyPrefix: 'fail-open', maxRequests: 2, windowMs: 60_000 }));
    app.get('/test', (_req, res) => res.json({ ok: true }));

    const res = await request(app).get('/test').expect(200);
    expect(res.body.ok).toBe(true);
  });

  it('should rate-limit requests from different IPs independently', async () => {
    mockIncr.mockResolvedValue(1);
    mockPexpire.mockResolvedValue(1);

    const app = express();
    app.use(setIp('1.2.3.4'));
    app.use(rateLimitMiddleware({ keyPrefix: 'ip-test', maxRequests: 1, windowMs: 60_000 }));
    app.get('/test', (_req, res) => res.json({ ok: true }));

    // First request from 1.2.3.4
    await request(app).get('/test').expect(200);
    expect(mockIncr).toHaveBeenCalledWith('ip-test:1.2.3.4');

    // Now mock returns 2 to simulate second request from same IP being blocked
    mockIncr.mockResolvedValue(2);
    const blocked = await request(app).get('/test').expect(429);
    expect(blocked.body.error).toBe('Too many requests');

    // Reset mock for a different IP
    mockIncr.mockReset();
    mockIncr.mockResolvedValue(1);
    mockPexpire.mockReset();

    const app2 = express();
    app2.use(setIp('5.6.7.8'));
    app2.use(rateLimitMiddleware({ keyPrefix: 'ip-test', maxRequests: 1, windowMs: 60_000 }));
    app2.get('/test', (_req, res) => res.json({ ok: true }));

    // First request from 5.6.7.8 should succeed
    const res2 = await request(app2).get('/test').expect(200);
    expect(res2.body.ok).toBe(true);
    expect(mockIncr).toHaveBeenCalledWith('ip-test:5.6.7.8');
  });
});
