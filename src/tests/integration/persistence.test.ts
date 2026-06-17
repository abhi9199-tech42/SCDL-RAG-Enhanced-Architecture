import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { FileVectorStore } from '../../storage/file_store';
import { SemanticUnit } from '../../types';
import * as fs from 'fs';
import * as path from 'path';

describe('Persistence Integration Test', () => {
  const testDir = './test-data';
  const testFile = 'test_vector_store.json';
  const absTestDir = path.resolve(testDir);
  const absTestPath = path.join(absTestDir, testFile);

  beforeEach(() => {
    // Clean up before test
    if (fs.existsSync(absTestDir)) {
      fs.rmSync(absTestDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up after test
    if (fs.existsSync(absTestDir)) {
        // Wait a bit for file handles to close? No, sync operations should be fine.
      fs.rmSync(absTestDir, { recursive: true, force: true });
    }
  });

  it('should persist semantic units across instances', async () => {
    // 1. Create first instance and add data
    const store1 = new FileVectorStore(testDir, testFile);
    
    const unit: SemanticUnit = {
      id: 'test-unit-1',
      content: 'This is a test content for persistence.',
      semantics: {
        id: 'test-unit-1',
        semanticVector: [0.1, 0.2, 0.3],
        intentNodes: [],
        sourceReferences: [],
        compressionRatio: 0.5,
        languageAgnosticHash: 'hash-123'
      },
      sourceReferences: [],
      metadata: {}
    };

    await store1.add(unit);
    const count1 = await store1.count();
    expect(count1).toBe(1);
    
    // Explicitly close or force save (implementation auto-saves on close/clear, but we might need to wait or force it)
    // FileVectorStore saves on interval or manually. Let's verify file exists.
    // Wait for save interval or force it? 
    // The implementation has private save(). 
    // But it saves on clear().
    // Let's rely on `close` which I added to `VectorStore` interface but need to verify implementation.
    // I added `close` to `FileVectorStore`!
    await store1.close();

    // Verify file exists
    expect(fs.existsSync(absTestPath)).toBe(true);

    // 2. Create second instance pointing to same file
    const store2 = new FileVectorStore(testDir, testFile);
    const count2 = await store2.count();
    expect(count2).toBe(1);

    const retrieved = await store2.get('test-unit-1');
    expect(retrieved).toBeDefined();
    expect(retrieved?.content).toBe(unit.content);
    
    await store2.close();
  });
});
