# COSMAN — Frontend

Luxury footwear e-commerce frontend. Pure HTML/CSS/JS — no framework, no build step.

## Structure
```
frontend/
├── index.html          # Homepage
├── shop.html           # Product listing
├── product.html        # Product detail
├── cart.html           # Cart & checkout
├── auth.html           # Login / Register
├── admin.html          # Admin dashboard
├── brand-guide.html    # Brand story
├── manifest.json       # PWA manifest
├── sw.js               # Service worker
├── robots.txt          # SEO
└── sitemap.xml         # SEO
```

## Design
- Colors: Black `#0A0A0A`, Gold `#C9A84C`, Cream `#F5F0E8`
- Fully responsive, mobile-first
- PWA-enabled (installable, offline-capable)

## Running
Open `index.html` directly in a browser, or serve with any static server:
```bash
npx serve frontend/
# or
python3 -m http.server 8080 --directory frontend/
```

## API Integration
The frontend communicates with the COSMAN backend exclusively through REST APIs.
Configure the API base URL in your JS config:
```js
const API_BASE_URL = 'http://localhost:5000/api'; // development
```

See [`backend/README.md`](../backend/README.md) for API documentation.
