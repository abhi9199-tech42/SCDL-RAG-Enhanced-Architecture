# Production Roadmap: SCDL-RAG Enhanced Architecture

## Overview

- **55 issues** identified (3 critical, 16 high, 22 medium, 14 low)
- **111 tests** passing, but **5 major modules** have zero unit tests
- **8+ duplicated** cosine similarity implementations
- **37 `Math.random()` calls** in production code
- **33 Python modules** completely untested

---

## Phase 1: Critical & Security Fixes (Days 1-3)

### 1.1 Type System Unification

| Fix | Files | Issue |
|-----|-------|-------|
| Merge `Contradiction` types | `src/types/index.ts`, `src/urcm/types.ts` | Two incompatible interfaces |
| Rename `ResolutionStrategy` | `src/urcm/types.ts` | Conflicts with `types/index.ts` |
| Fix `Resolution` return type | `src/urcm/processor.ts:140-151` | Returns wrong shape entirely |
| Fix `vectorStore` type | `src/system/core.ts:27` | `InMemoryVectorStore` → `VectorStore` |
| Fix `ResonancePattern` shape | `src/urcm/processor.ts:79-86` | Uses `semanticIds` instead of `sourceIds` |
| Fix `DecisionRecord` calls | `src/audit/explainable.ts`, `src/api/routes.ts` | Missing `confidence` field |
| Fix `DecisionType` values | Same files | Invalid enum members used |
| Fix `IntentNode` properties | `src/audit/explainable.ts`, `src/isre/compression/optimizer.ts` | Access non-existent fields |

### 1.2 Security Hardening

| Fix | File | Issue |
|-----|------|-------|
| Remove hardcoded API key | `src/api/middleware/auth.ts:6` | Throw if env var missing |
| Implement rate limiting | `src/api/routes.ts` | Config exists but middleware missing |
| Restrict CORS | `src/config/types.ts:317` | Default `['*']` → explicit origins |
| Enable auth by default | `src/config/types.ts:322` | `enabled: false` → `true` |
| Sanitize error responses | `src/api/routes.ts` | Internal details leaked to clients |

### 1.3 Fix Logic Bugs

| Fix | File | Issue |
|-----|------|-------|
| Fix `finally` double-count | `src/system/core.ts:346-353,389-394` | Success recorded even on failure |
| Fix `calculateThroughput` | `src/system/performance.ts:304-313` | Uses lifetime count, not last minute |
| Fix dead code in cosine sim | `src/storage/file_store.ts:117-120` | Redundant dimension check |

---

## Phase 2: Eliminate Mock/Random Data (Days 4-6)

### 2.1 Replace `Math.random()` (37 occurrences)

| Module | Fix |
|--------|-----|
| `src/urcm/processor.ts` | Use deterministic vectors from content hash |
| `src/urcm/core/resonance.ts` | Use seeded PRNG or content-derived initialization |
| `src/urcm/core/attractor.ts` | Use deterministic phase initialization |
| `src/urcm/core/mesh.ts` | Use deterministic phase |
| `src/system/performance.ts` | Use `os.cpus()`, `os.loadavg()`, `os.totalmem()` |
| `src/isre/compression/optimizer.ts` | Compute vectors from content features |
| `src/urcm/contradiction/semantic_detector.ts` | Use `crypto.randomUUID()` for IDs |
| `src/audit/trail.ts` | Use `crypto.randomUUID()` |
| `src/audit/explainable.ts` | Use `crypto.randomUUID()` |
| `src/api/routes.ts` | Use `crypto.randomUUID()` |
| `src/isre/multilang/validator.ts` | Use `crypto.randomUUID()` |

### 2.2 Replace Toy Implementations

| Fix | File | What to do |
|-----|------|------------|
| Replace 8-word semantic map | `src/isre/compression/text.ts` | Load from file or use embedding model |
| Fix hardcoded compression ratio | `src/isre/processor.ts:62` | Calculate from actual sizes |
| Fix mock convergence metrics | `src/urcm/processor.ts:147-149` | Track actual iterations/error |
| Implement `detectTemporalConflicts` | `src/urcm/contradiction/detector.ts:51-57` | Currently a no-op |
| Implement `detectInconsistencies` | `src/isre/multilang/validator.ts:249-253` | Currently a no-op |

---

## Phase 3: Code Quality & DRY (Days 7-9)

### 3.1 Extract Shared Utilities

Create `src/utils/` directory:

```
src/utils/
  vector.ts       — cosineSimilarity, vectorAdd, vectorNorm (replace 8 copies)
  id.ts           — deterministic ID generation (replace Math.random)
  validation.ts   — shared input validation helpers
```

### 3.2 Split Oversized Files

| File (lines) | Split Into |
|---------------|------------|
| `src/audit/explainable.ts` (1449) | `explainable.ts`, `expert-review.ts`, `source-trace.ts` |
| `src/isre/compression/optimizer.ts` (1024) | `optimizer.ts`, `strategies.ts`, `content-types.ts` |
| `src/system/performance.ts` (1024) | `performance.ts`, `scaling.ts`, `circuit-breaker.ts`, `cache.ts` |
| `src/urcm/contradiction/semantic_detector.ts` (1056) | `semantic-detector.ts`, `pattern-rules.ts`, `domain-rules.ts` |

### 3.3 Eliminate `any` Types

- Create `EnhancedComponents` interface for `src/api/server.ts` and `src/api/routes.ts`
- Replace all `as any` casts in `src/system/core.ts` with proper enum values
- Upgrade ESLint `no-explicit-any` from `warn` to `error`

### 3.4 Fix Resource Leaks

| Fix | File | Issue |
|-----|------|-------|
| Add `destroy()` to FileVectorStore | `src/storage/file_store.ts` | Interval leak |
| Add `destroy()` to PerformanceMonitor | `src/system/performance.ts` | Interval leak |
| Add size limits to all in-memory stores | Multiple files | Unbounded growth |
| Add process exit handlers | `src/system/core.ts` | Cleanup on crash |

### 3.5 Clean Dead Code

- Remove empty `src/isre/bridge.ts`
- Remove or implement no-op methods

---

## Phase 4: Test Coverage (Days 10-14)

### 4.1 Create Shared Test Infrastructure

```
src/tests/
  helpers/
    fixtures.ts      — Reusable SemanticUnit, IntentGraph, etc. generators
    mocks.ts         — Mock ISREProcessor, VectorStore, URCMProcessor
    setup.ts         — Global test setup, cleanup hooks
```

### 4.2 Unit Tests for Untested Modules (Priority Order)

| Module | Lines | Tests to Write |
|--------|-------|----------------|
| `src/urcm/contradiction/semantic_detector.ts` | 1056 | Pairwise analysis, cluster detection, pattern rules, domain rules |
| `src/audit/explainable.ts` | 1449 | Explanation generation, expert review, source tracing, confidence |
| `src/system/performance.ts` | 1024 | Monitor thresholds, circuit breaker states, cache eviction, scaling |
| `src/urcm/processor.ts` | 216 | Frequency mapping, resonance detection, convergence, oscillatory reasoning |
| `src/isre/processor.ts` | 148 | Compression, graph construction, query intent analysis |
| `src/urcm/contradiction/detector.ts` | 58 | Explicit conflict detection, temporal conflict detection |
| `src/api/middleware/auth.ts` | 20 | Auth pass/reject, missing key, invalid key |

### 4.3 API Route Tests

Expand `src/tests/` to cover ALL endpoints:

- `GET /api/health`
- `POST /api/search` / `POST /api/retrieve`
- `POST /api/contradictions/detect`
- `POST /api/consistency/validate`
- `GET /api/audit/trace/:id`
- `GET /api/audit/explain/:id`
- `GET /api/performance/metrics`
- `POST /api/explain/retrieval`

### 4.4 Edge Case & Property Tests

- Empty/null inputs (empty strings, null vectors, empty graphs)
- Dimension mismatch handling
- NaN/Infinity in vectors
- Very large inputs (stress testing)
- Concurrent read/write to stores
- File corruption recovery in FileVectorStore

### 4.5 Fix Existing Test Issues

- Remove `assert True` placeholders in Python tests
- Fix weak assertions in property tests
- Add `beforeEach` cleanup for shared state
- Fix `test:pbt` script path in `package.json`

---

## Phase 5: Production Infrastructure (Days 15-18)

### 5.1 Environment Configuration

- Add `engines` field to `package.json` (`node >= 18`)
- Auto-detect `NODE_ENV` in config manager
- Add `.env.example` with all required env vars
- Add config validation on startup (fail fast)

### 5.2 Monitoring & Observability

- Replace mock performance metrics with real `os` module data
- Add structured logging with correlation IDs
- Add health check endpoint with dependency status
- Add request/response logging middleware

### 5.3 Error Handling

- Add Zod validation to all API endpoints
- Add global unhandled rejection handler
- Add retry logic with exponential backoff for FileVectorStore
- Add circuit breaker integration to external calls

### 5.4 Build & CI

- Fix `vitest.config.ts` test patterns
- Add Python test runner to CI (`pytest`)
- Add coverage thresholds to CI
- Add security audit step
- Add type coverage reporting

---

## Phase 6: Polish & Documentation (Days 19-21)

### 6.1 Documentation

- Add JSDoc to all public APIs
- Add architecture decision records (ADRs)
- Add API documentation (OpenAPI/Swagger)
- Add deployment guide

### 6.2 Final Validation

- Run full test suite with coverage > 80%
- Run security audit (no critical vulnerabilities)
- Performance benchmarking
- Load testing
- Verify all `as any` casts eliminated
- Verify no `Math.random()` in production code

---

## Execution Timeline

```
Week 1: Phase 1 (Critical/Security) → Phase 2 (Mock Data)
Week 2: Phase 3 (Code Quality) → Phase 4 (Tests - first half)
Week 3: Phase 4 (Tests - second half) → Phase 5 (Infrastructure)
Week 4: Phase 6 (Polish) → Final validation
```

---

## Issue Summary

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | 3 | To fix in Phase 1 |
| HIGH | 16 | To fix in Phase 1-2 |
| MEDIUM | 22 | To fix in Phase 3-5 |
| LOW | 14 | To fix in Phase 6 |
| **TOTAL** | **55** | |

---

## Critical Issues (Fix Immediately)

1. **`Resolution` type completely wrong** in `src/urcm/processor.ts:140-151` — returns objects with fields that don't exist on the `Resolution` interface
2. **`ResolutionStrategy` type conflict** between `src/types/index.ts` and `src/urcm/types.ts` — same name, completely different shapes
3. **Hardcoded fallback API key** in `src/api/middleware/auth.ts:6` — `'scdl-default-key-12345'`
4. **`finally` block double-counts success** in `src/system/core.ts:346-353` — failed operations recorded as both failure and success
5. **`Math.random()` in production code** — 37 occurrences corrupt reproducibility and monitoring

---

## High Priority Issues

6. `vectorStore` type mismatch in `src/system/core.ts:27`
7. `ResonancePattern` shape mismatch in `src/urcm/processor.ts:79-86`
8. CORS wildcard default in `src/config/types.ts:317`
9. Authentication disabled by default in `src/config/types.ts:322`
10. Rate limiting config exists but middleware missing
11. `FileVectorStore` interval leak in `src/storage/file_store.ts:24-28`
12. Unbounded in-memory data structures (6+ locations)
13. `calculateThroughput` uses lifetime count in `src/system/performance.ts:304-313`
14. Mock performance metrics in `src/system/performance.ts:297-301`
15. Toy semantic map (8 words) in `src/isre/compression/text.ts:8-18`
16. Hardcoded compression ratio in `src/isre/processor.ts:62`
17. No tests for 5 major modules totaling 3893 lines

---

## Medium Priority Issues

18. `DecisionRecord` missing `confidence` field
19. Invalid `DecisionType` values used
20. `IntentNode` property access mismatches
21. `SCDLSystem` interface incomplete
22. Error messages leak internal details
23. `PerformanceMonitor` interval not cleaned up
24. Cosine similarity duplicated 8+ times
25. Intent alignment calculation duplicated
26. `detectTemporalConflicts` is a no-op
27. `detectInconsistencies` is a no-op
28. Mock compression ratio
29. Hardcoded convergence metrics
30. Oversized files (4 files > 1000 lines)
31. Excessive `any` type usage
32. `@ts-ignore` style `as any` casts
33. Global singleton `configManager`
34. No input validation on API endpoints
35. Unhandled promise rejections
36. Silent failure in FileVectorStore.save()
37. No null/undefined checks on vector operations
38. Express 5.x compatibility concerns
39. Zod v4 breaking changes
40. No tests for auth middleware

---

## Low Priority Issues

41. Dead code in cosine similarity
42. Empty `bridge.ts` file
43. ESLint `no-explicit-any` is warn not error
44. `skipLibCheck: true`
45. Test location mismatch
46. Default `env: 'development'` hardcoded
47. No `engines` field in package.json
48. No tests for logger utility
49. Python modules untested (33 files)
50. `assert True` placeholders in Python tests
51. Weak assertions in property tests
52. No shared test fixtures
53. No edge case tests
54. No concurrent access tests
55. Test isolation issues
