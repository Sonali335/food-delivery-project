# Food delivery

A web application for food delivery that connects **customers**, **drivers**, and **restaurants** in one platform.

## Tech stack

- **Frontend:** React (Vite), React Router, CSS modules, Fetch API
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Auth & security:** JWT, bcrypt
- **Email:** Nodemailer
- **Media (restaurant menu):** Cloudinary (optional)

## Documentation

| Document | Description |
| -------- | ----------- |
| [`backend/doc/API.md`](backend/doc/API.md) | Auth, profile, health |
| [`backend/doc/restaurant.md`](backend/doc/restaurant.md) | Menu, categories, restaurant status |
| [`backend/doc/driver.md`](backend/doc/driver.md) | Driver location API |
| [`backend/doc/orders.md`](backend/doc/orders.md) | Order lifecycle API |

**API base URL (development):** `http://localhost:5000`

### API route overview

| Prefix | Used by |
| ------ | ------- |
| `/api/auth` | All users (signup, login, OTP, password reset) |
| `/api/customer` | All roles (profile CRUD) |
| `/api/restaurant` | Restaurant status |
| `/api/menu`, `/api/category` | Restaurant menu & categories |
| `/api/driver` | Drivers (live location) |
| `/api/orders` | Orders (create, list, status lifecycle) |

## Frontend routes (protected unless noted)

| Path | Role | Page |
| ---- | ---- | ---- |
| `/`, `/login`, `/verify-otp`, … | public | Auth flows |
| `/setup/customer` | customer | Profile setup |
| `/setup/driver` | driver | Profile setup |
| `/setup/restaurant` | restaurant | Profile setup |
| `/dashboard` | any logged-in | General dashboard |
| `/driver/dashboard` | driver | Driver dashboard (earnings placeholders, location update) |
| `/restaurant/dashboard` | restaurant | Restaurant dashboard |
| `/restaurant/menu`, `/restaurant/menu/create`, `/restaurant/menu/edit/:id` | restaurant | Menu management |
| `/restaurant/categories` | restaurant | Category management |

## Project structure

```
food-delivery-project/
├── backend/
│   ├── doc/           # API documentation
│   └── src/
│       ├── routes/    # auth, customer, menu, category, restaurant, driver, orders
│       ├── controllers/
│       ├── models/
│       └── services/
└── frontend/
    └── src/
        ├── api/       # auth, profile, menu, category, restaurant, driver
        └── pages/
```

## Running locally

**Backend** (from `backend/`):

```bash
npm install
cp .env.example .env   # set MONGO_URI, JWT_SECRET, etc.
npm run dev
```

**Frontend** (from `frontend/`):

```bash
npm install
npm run dev
```

Vite proxies `/api` to the backend (default `http://localhost:5000`). All API calls use paths under `/api/...`.

Optional: set `VITE_API_BASE_URL` in the frontend for production builds pointing at your deployed API.
