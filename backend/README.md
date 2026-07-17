# COSMAN — Backend

Production-ready REST API for the COSMAN luxury e-commerce platform.

## Tech Stack
- **Runtime**: Node.js 20 + Express.js
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis
- **Auth**: JWT (access + refresh tokens), bcrypt
- **Storage**: Cloudinary
- **Email**: Nodemailer (SMTP)
- **Payments**: Stripe + PayPal
- **Docs**: Swagger/OpenAPI
- **Validation**: Zod
- **Logging**: Winston
- **Testing**: Jest + Supertest

## Quick Start
```bash
cd backend
cp .env.example .env   # Fill in your values
npm install
npx prisma migrate dev
npx prisma generate
npm run dev
```

## Docker
```bash
docker-compose up -d
# Starts: API (5000), PostgreSQL (5432), Redis (6379)
```

## API Base URL
- Development: `http://localhost:5000/api`
- Swagger docs: `http://localhost:5000/api/docs`

## Architecture
Clean Architecture with layered pattern:
```
Controllers → Services → Repositories → Prisma → PostgreSQL
```

See [docs/architecture.md](docs/architecture.md) for full details.

## Modules
| Module | Endpoints | Description |
|--------|-----------|-------------|
| Auth | `/api/auth` | Register, login, refresh, password reset |
| Users | `/api/users` | Profile, addresses |
| Products | `/api/products` | CRUD, variants, search, featured |
| Categories | `/api/categories` | CRUD, tree |
| Collections | `/api/collections` | CRUD, products |
| Cart | `/api/cart` | Items, coupon |
| Wishlist | `/api/wishlist` | Add, remove, move-to-cart |
| Orders | `/api/orders` | Create, track, cancel, admin |
| Payments | `/api/payments` | Stripe, PayPal, webhooks |
| Coupons | `/api/coupons` | Validate, CRUD |
| Reviews | `/api/reviews` | Ratings, CRUD |
| Admin | `/api/admin` | Users, dashboard, analytics |
| Notifications | `/api/notifications` | List, read, unread count |
| Search | `/api/search` | Cross-entity search |

## Testing
```bash
npm test
```

## Independent Project
This backend is fully independent. It has no dependency on the frontend.
Any HTTP client can consume the API. See [docs/api-overview.md](docs/api-overview.md).
