# COSMAN — Luxury Footwear E-Commerce

Full-stack luxury footwear brand platform.

## Repository Structure
```
cosan/
├── frontend/    # Static HTML/CSS/JS — pure frontend, no build step
├── backend/     # Node.js + Express + Prisma REST API
├── docs/        # Shared documentation (if any)
└── README.md    # This file
```

## Two Independent Projects

### Frontend (`/frontend`)
Pure HTML/CSS/JavaScript. No framework, no build step, no backend dependency at the code level.
- Served as static files
- Communicates with backend exclusively via REST API calls
- Can be deployed to any static host (Vercel, Netlify, Cloudflare Pages, S3)
- See [`frontend/README.md`](frontend/README.md)

### Backend (`/backend`)
Node.js + Express + Prisma + PostgreSQL REST API.
- Fully independent — no knowledge of the frontend
- Any HTTP client can consume the API
- Docker support (app + PostgreSQL + Redis)
- See [`backend/README.md`](backend/README.md)

## Communication
```
Frontend (browser)  →  HTTP/REST (JSON)  →  Backend (Express API)
                           ↓
                    PostgreSQL + Redis
```

The frontend calls the backend via REST endpoints under `/api/*`.
No shared code, no shared types, no build-time coupling.

## Deployment
- **Frontend**: Deploy `frontend/` to any static hosting
- **Backend**: Deploy `backend/` to any Node.js host (Render, Railway, Fly.io, AWS)
- Configure `API_BASE_URL` in frontend to point to the backend URL

## Brand
- Colors: Black `#0A0A0A`, Gold `#C9A84C`, Cream `#F5F0E8`
- Origin: Morocco
