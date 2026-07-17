# COSMAN Backend Architecture

## Overview
The COSMAN backend follows **Clean Architecture** principles with a layered approach: Controllers → Services → Repositories → Prisma ORM → PostgreSQL.

## Folder Structure
```
backend/
├── src/
│   ├── config/        # Environment, database, Redis configuration
│   ├── controllers/   # HTTP request handlers (thin controllers)
│   ├── services/      # Business logic layer
│   ├── repositories/  # Data access layer (Prisma queries)
│   ├── routes/         # Express route definitions
│   ├── middlewares/   # Auth, validation, error handling, rate limiting
│   ├── validators/    # Zod schemas for input validation
│   ├── utils/         # Logger, ApiError, ApiResponse, helpers
│   ├── jobs/          # Cron jobs (low stock, coupon cleanup, summaries)
│   └── app.js         # Express app entry point
├── prisma/            # Prisma schema and migrations
├── tests/            # Unit and integration tests
├── docs/             # API and architecture documentation
├── Dockerfile        # Production container
└── docker-compose.yml # Full stack orchestration
```

## Layer Responsibilities

### Controllers
- Parse HTTP request (body, params, query)
- Call the appropriate service method
- Return HTTP response with consistent format
- No business logic

### Services
- Contains all business logic
- Orchestrates repository calls
- Handles caching (Redis)
- Triggers side effects (emails, notifications)
- Validates business rules

### Repositories
- Pure data access layer
- All Prisma queries live here
- Returns plain data objects
- No business logic

## Data Flow
```
HTTP Request → Router → Middleware (auth, validation, rate-limit)
  → Controller → Service (business logic, caching, side-effects)
    → Repository (Prisma query) → PostgreSQL
  ← Service (transform data)
  ← Controller (format response)
← HTTP Response
```

## Security Measures
- **JWT Authentication**: Access + refresh token pattern with httpOnly cookies
- **Password Hashing**: bcryptjs with salt rounds
- **Rate Limiting**: express-rate-limit (general + auth-specific)
- **Helmet**: Security headers
- **CORS**: Configurable allowed origins
- **Input Sanitization**: express-mongo-sanitize, xss-clean
- **Input Validation**: Zod schemas on all endpoints
- **Role-Based Access**: CUSTOMER, ADMIN, MODERATOR roles

## Caching Strategy (Redis)
- Product listings cached with 5-minute TTL
- Product details cached with 10-minute TTL
- Featured products cached with 15-minute TTL
- Cart data cached in Redis session with 30-minute TTL
- Cache invalidated on product/order mutations
- Cache keys follow pattern: `resource:action:identifier`

## Error Handling
- Centralized error middleware in `errorHandler.js`
- Custom `ApiError` class with statusCode, message, errors
- Prisma errors mapped to appropriate HTTP codes
- Zod validation errors formatted consistently
- Stack traces only in development

## Testing Strategy
- **Unit Tests**: Service layer with mocked repositories
- **Integration Tests**: API endpoints with supertest
- **Mock Data**: Centralized mock factories
- **Mock DB**: Chainable Prisma mock for consistent testing
- Run: `npm test`

## Deployment
- Docker multi-stage build (Node 20 Alpine)
- docker-compose for full stack (app + PostgreSQL + Redis)
- Prisma migrations run on startup
- Graceful shutdown on SIGTERM/SIGINT
