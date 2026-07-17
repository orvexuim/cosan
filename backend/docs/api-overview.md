# COSMAN API Documentation

## Overview
The COSMAN API is a RESTful API for a luxury footwear e-commerce platform built with Node.js, Express, and PostgreSQL (Prisma ORM).

## Base URL
- **Development**: `http://localhost:5000/api`
- **Production**: `https://api.cosman.com/api`

## Authentication
All protected endpoints require a JWT Bearer token. Include it in the `Authorization` header:
```
Authorization: Bearer <access_token>
```

Tokens are obtained via `/api/auth/register` or `/api/auth/login`. Access tokens expire in 15 minutes; refresh tokens expire in 7 days.

## Error Format
All errors return a consistent JSON structure:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error description",
  "errors": [],
  "stack": "..." // development only
}
```

## Pagination
List endpoints accept `page` and `limit` query parameters:
```
GET /api/products?page=1&limit=20
```
Response includes:
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

## Rate Limiting
- General API: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes
- Password reset: 3 requests per hour

## Endpoints Summary

| Resource | Endpoint | Methods | Auth |
|----------|----------|---------|------|
| Auth | /api/auth | POST register, login, logout, refresh-token, forgot-password, reset-password | Mixed |
| Users | /api/users | GET/PUT profile, CRUD addresses | Required |
| Products | /api/products | GET list, detail, search, featured; POST/PUT/DELETE (admin) | Mixed |
| Categories | /api/categories | GET list, tree, detail; POST/PUT/DELETE (admin) | Mixed |
| Collections | /api/collections | GET list, detail, products; POST/PUT/DELETE (admin) | Mixed |
| Cart | /api/cart | GET, POST items, PUT/DELETE items, POST coupon | Required |
| Wishlist | /api/wishlist | GET, POST/DELETE items, move-to-cart | Required |
| Orders | /api/orders | POST create, GET list/detail, PUT cancel; admin: GET all, PUT status/tracking | Required |
| Payments | /api/payments | POST stripe intent, paypal create/capture, refund, webhook | Required |
| Coupons | /api/coupons | POST validate; admin: CRUD | Mixed |
| Reviews | /api/reviews | GET by product; POST create, PUT/DELETE own | Mixed |
| Admin | /api/admin | GET users, dashboard, analytics | Admin |
| Notifications | /api/notifications | GET, PATCH read, unread-count | Required |
| Search | /api/search | GET with query params | Public |

## Swagger Docs
Interactive API documentation available at: `http://localhost:5000/api/docs`

## Environment Setup
1. Copy `.env.example` to `.env` and fill in your values
2. Install dependencies: `npm install`
3. Run Prisma migrations: `npx prisma migrate dev`
4. Generate Prisma client: `npx prisma generate`
5. Start the server: `npm run dev`

## Docker
```bash
docker-compose up -d
```
Starts app (port 5000), PostgreSQL (port 5432), and Redis (port 6379).
