import { describe, it, expect } from 'vitest';
import { validateApiKey } from '../../api/middleware/auth';

function createMockReq(apiKey?: string) {
  return {
    headers: apiKey ? { 'x-api-key': apiKey } : {},
    ip: '127.0.0.1'
  } as any;
}

function createMockRes() {
  const res: any = {};
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.json = (body: any) => { res.body = body; return res; };
  return res;
}

describe('validateApiKey middleware', () => {
  const originalEnv = process.env.SCDL_API_KEY;

  beforeEach(() => {
    process.env.SCDL_API_KEY = 'test-api-key-12345';
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.SCDL_API_KEY = originalEnv;
    } else {
      delete process.env.SCDL_API_KEY;
    }
  });

  it('should pass with valid API key', () => {
    const req = createMockReq('test-api-key-12345');
    const res = createMockRes();
    let nextCalled = false;
    const next = () => { nextCalled = true; };
    validateApiKey(req, res, next);
    expect(nextCalled).toBe(true);
  });

  it('should reject with invalid API key', () => {
    const req = createMockReq('wrong-key');
    const res = createMockRes();
    const next = () => {};
    validateApiKey(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(res.body.error.message).toContain('Invalid');
  });

  it('should reject when API key is missing', () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = () => {};
    validateApiKey(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 500 when SCDL_API_KEY env not set', () => {
    delete process.env.SCDL_API_KEY;
    const req = createMockReq('any-key');
    const res = createMockRes();
    const next = () => {};
    validateApiKey(req, res, next);
    expect(res.statusCode).toBe(500);
    expect(res.body.error.code).toBe('SERVER_CONFIGURATION_ERROR');
    expect(res.body.error.message).toContain('not configured');
  });
});
