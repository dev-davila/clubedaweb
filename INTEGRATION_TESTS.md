# Integration Tests Documentation

## Overview

This document outlines the comprehensive integration test suite for the M3Solutions API security and validation system. The tests cover all 25+ API endpoints with validation, rate limiting, and error handling.

## Test Structure

### Test Directories
```
__tests__/api/
├── setup.ts                  # Test utilities, constants, and helpers
├── tags.test.ts             # Tags API endpoints (6 endpoints)
├── authors.test.ts          # Authors API endpoints (4 endpoints)
├── partners.test.ts         # Partners API endpoints (5 endpoints)
├── ai.test.ts               # AI endpoints (3 endpoints)
├── chronicles.test.ts       # Chronicles API endpoints (6 endpoints)
├── site-config.test.ts      # Site configuration endpoints (2 endpoints)
├── validation.test.ts       # Zod validation and error handling
├── rate-limit.test.ts       # Rate limiting tests
├── uuid-validation.test.ts  # UUID format validation
└── cache.test.ts            # Cache-aside pattern tests
```

## Test Coverage by Endpoint

### Tags API (`/api/gestor/tags`)
- **GET** `/api/gestor/tags` - Rate limit: 100 req/min
- **POST** `/api/gestor/tags` - Rate limit: 5 req/min
- **GET** `/api/gestor/tags/[id]` - UUID validation required
- **PUT** `/api/gestor/tags/[id]` - UUID validation + Zod validation
- **DELETE** `/api/gestor/tags/[id]` - Rate limit: 5 req/min
- **PATCH** `/api/gestor/tags/reorder` - Reordering functionality

### Authors API (`/api/gestor/authors`)
- **GET** `/api/gestor/authors` - Rate limit: 100 req/min, Pagination
- **POST** `/api/gestor/authors` - Rate limit: 10 req/min, Email validation
- **GET** `/api/gestor/authors/[id]` - UUID validation
- **PUT** `/api/gestor/authors/[id]` - Rate limit: 20 req/min

### Partners API (`/api/gestor/partners`)
- **GET** `/api/gestor/partners` - Rate limit: 100 req/min, Filtering
- **POST** `/api/gestor/partners` - Rate limit: 10 req/min, Name validation (2-100 chars)
- **GET** `/api/gestor/partners/[id]` - UUID validation
- **PUT** `/api/gestor/partners/[id]` - Rate limit: 20 req/min, showOnHome flag
- **DELETE** `/api/gestor/partners/[id]` - Rate limit: 5 req/min

### AI Endpoints (`/api/gestor/ai`)
- **POST** `/api/gestor/ai/generate-text` - Rate limit: 20 req/min, Prompt validation (10-2000 chars)
- **POST** `/api/gestor/ai/generate-image` - Rate limit: 5 req/min, Provider enum validation
- **POST** `/api/gestor/ai-suggest-locations` - Rate limit: 15 req/min, Attendance type + page objective validation

### Chronicles API (`/api/gestor/chronicles`)
- **GET** `/api/gestor/chronicles` - Rate limit: 100 req/min, Pagination, Status filtering
- **POST** `/api/gestor/chronicles` - Rate limit: 10 req/min, Title (5-200), Content (20+ chars)
- **GET** `/api/gestor/chronicles/[id]` - UUID validation
- **PUT** `/api/gestor/chronicles/[id]` - Rate limit: 20 req/min, Status transitions
- **DELETE** `/api/gestor/chronicles/[id]` - Rate limit: 5 req/min

### Site Configuration (`/api/gestor/site-config`)
- **GET** `/api/gestor/site-config` - Cache-aside pattern
- **PUT** `/api/gestor/site-config` - Cache invalidation on update

## Test Categories

### 1. Validation Tests
Tests that verify Zod schema validation and request payload handling:
- Required field validation
- Field type validation
- String length constraints (2-100, 5-200, 10-2000 chars)
- Enum validation (status, provider, attendanceType, pageObjective)
- UUID format validation
- Email format validation
- URL format validation

### 2. Rate Limiting Tests
Tests that verify IP-based rate limiting:
- Requests are tracked by IP address
- Rate limits are enforced per endpoint
- 429 status code returned when limit exceeded
- X-RateLimit-* headers included in response
- Retry-After header provided
- Rate limit counters reset after time window

### 3. UUID Validation Tests
Tests that verify UUID validation across all endpoints:
- Valid v4 UUID format acceptance
- Invalid UUID rejection
- 400 status code for invalid UUIDs in path parameters
- UUID validation in request body (articleId field)

### 4. Error Handling Tests
Tests that verify consistent error response format:
- Missing session returns 401
- Invalid token returns 401
- Insufficient permissions return 403
- Validation errors return 400 with details
- Error responses include status code
- No sensitive information in error messages

### 5. Cache Tests
Tests that verify cache-aside pattern:
- GET responses are cached
- Cache invalidated on POST/PUT/DELETE
- Cached data served on subsequent requests
- Cache headers properly set
- Cache misses handled correctly

### 6. Endpoint-Specific Tests
Tests for functionality specific to each endpoint group:
- Tag reordering functionality
- Partner active status filtering
- Chronicle status filtering and transitions
- Author email uniqueness
- AI generation with different providers

## Running Tests

### Run All Tests
```bash
cd nextjs_space
yarn test
```

### Run Specific Test File
```bash
yarn test __tests__/api/tags.test.ts
```

### Run Tests in Watch Mode
```bash
yarn test --watch
```

### Run Tests with Coverage
```bash
yarn test --coverage
```

### Run Tests Matching Pattern
```bash
yarn test --testNamePattern="should validate"
```

## Test Configuration

### Jest Configuration
- **Test Environment**: node
- **Module Name Mapper**: Supports @/ alias
- **Test Match**: `**/__tests__/**/*.[jt]s?(x)` and `**/?(*.)+(spec|test).[jt]s?(x)`

### Setup Files
- `jest.setup.js`: Configures testing-library and other global test setup

## Test Data

### Constants (from `setup.ts`)
- `TEST_USER_ID`: f47ac10b-58cc-4372-a567-0e02b2c3d479
- `TEST_TAG_ID`: a47ac10b-58cc-4372-a567-0e02b2c3d470
- `TEST_AUTHOR_ID`: b47ac10b-58cc-4372-a567-0e02b2c3d471
- `TEST_PARTNER_ID`: c47ac10b-58cc-4372-a567-0e02b2c3d472
- `TEST_CHRONICLE_ID`: d47ac10b-58cc-4372-a567-0e02b2c3d473
- `TEST_INVALID_UUID`: invalid-uuid

### Helper Functions
- `wait(ms)`: Sleep utility for timing tests
- `validateErrorResponse(body)`: Assert error response structure
- `validateSuccessResponse(body)`: Assert success response structure

## Implementation Notes

### Phase 1: Skeleton Tests Created
This initial phase creates comprehensive test skeletons for all 25+ API endpoints organized by endpoint group. Each test includes:
- Descriptive test names following "should..." pattern
- Organized describe blocks by HTTP method
- Rate limit specifications documented as comments
- Validation constraints documented as comments
- Error handling scenarios specified

### Phase 2: Test Implementation (Planned)
Future phase will implement actual test logic:
- Mock database queries using `@prisma/client` mocks
- Mock authentication sessions
- Test actual API endpoints using supertest
- Verify response status codes
- Verify response payload structure
- Test rate limiting behavior
- Test validation error messages

### Phase 3: Integration with CI/CD (Planned)
- GitHub Actions workflow for running tests
- Coverage reporting
- Test failure notifications

## Best Practices

1. **Test Isolation**: Each test is independent and doesn't rely on other tests
2. **Clear Naming**: Test names clearly describe what they verify
3. **Consistent Organization**: Tests grouped by HTTP method and endpoint
4. **Rate Limit Documentation**: Rate limits specified in describe blocks
5. **Validation Constraints**: Field constraints documented in test descriptions

## Endpoint Rate Limit Summary

| Endpoint Group | GET | POST | PUT | DELETE | PATCH |
|----------------|-----|------|-----|--------|-------|
| Tags | 100 | 5 | - | 5 | - |
| Authors | 100 | 10 | 20 | - | - |
| Partners | 100 | 10 | 20 | 5 | - |
| AI | - | 20/5/15 | - | - | - |
| Chronicles | 100 | 10 | 20 | 5 | - |
| Site Config | - | - | - | - | - |

Note: See specific endpoint documentation for detailed rate limit info.

## Validation Rules Summary

| Type | Rules |
|------|-------|
| Tag Name | 2-100 characters |
| Author Name | 2-100 characters |
| Partner Name | 2-100 characters |
| Chronicle Title | 5-200 characters |
| Chronicle Content | 20+ characters |
| AI Prompt | 10-2000 characters |
| Service Type | 2-100 characters |
| UUID | Valid v4 format |
| Email | Valid email format |
| URL | Valid URL format |

## Appendix: Upcoming Test Implementation

The skeleton tests provide a comprehensive blueprint for implementation. Key areas for Phase 2:

1. **Database Mocking**: Mock Prisma client calls
2. **Authentication Mocking**: Mock NextAuth sessions
3. **API Testing**: Use supertest for HTTP requests
4. **Response Validation**: Assert status codes and payloads
5. **Edge Cases**: Test boundary conditions and error scenarios
