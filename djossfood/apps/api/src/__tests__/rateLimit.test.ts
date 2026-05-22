import request from 'supertest';
import express from 'express';
import { rateLimitMiddleware } from '../middleware/rateLimit';

jest.mock('ioredis', () => {
  const mockIncr = jest.fn();
  const mockPexpire = jest.fn();
  (globalThis as any).__mockRedis = { mockIncr, mockPexpire };
  return jest.fn().mockImplementation(() => ({
    incr: (...args: any[]) => mockIncr(...args),
    pexpire: (...args: any[]) => mockPexpire(...args),
    on: jest.fn(),
  }));
});

const { mockIncr, mockPexpire } = (globalThis as any).__mockRedis as {
  mockIncr: jest.Mock;
  mockPexpire: jest.Mock;
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
  });
});
