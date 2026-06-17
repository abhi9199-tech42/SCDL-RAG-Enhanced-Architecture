import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../api/server';
import * as fc from 'fast-check';

describe('API Property Tests', () => {
  const app = createApp();
  const TEST_API_KEY = 'test-api-key-for-ci';

  beforeAll(() => {
    process.env.SCDL_API_KEY = TEST_API_KEY;
  });

  afterAll(() => {
    delete process.env.SCDL_API_KEY;
  });

  it('Property 15: API Response Structure Consistency', async () => {
    // Fuzz test the /ingest endpoint
    await fc.assert(
      fc.asyncProperty(fc.string(), fc.record({ key: fc.string() }), async (content, metadata) => {
        const payload = { content, metadata };
        
        const res = await request(app)
          .post('/api/ingest')
          .set('x-api-key', TEST_API_KEY)
          .send(payload);

        // Check structure regardless of success/fail
        expect(res.body).toHaveProperty('success');
        if (res.body.success) {
           expect(res.body).toHaveProperty('data');
           expect(res.status).toBe(200);
        } else {
           expect(res.body).toHaveProperty('error');
           // content could be empty string
           if (!content) expect(res.status).toBe(400);
        }
      })
    );
  });

  it('Batch Ingestion Test', async () => {
    // Test batch ingestion with mixed valid/invalid items
    const items = [
      { content: "Valid Item 1", id: "1" },
      { content: "", id: "2" }, // Invalid
      { content: "Valid Item 3", id: "3" }
    ];

    const res = await request(app)
      .post('/api/batch/ingest')
      .set('x-api-key', TEST_API_KEY)
      .send({ items });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.processed).toBe(3);
    expect(res.body.data.details[0].success).toBe(true);
    expect(res.body.data.details[1].success).toBe(false); // Failed
    expect(res.body.data.details[2].success).toBe(true);
  });
});
