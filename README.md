# Food delivery

A full-stack web app that connects **customers**, **drivers**, and **restaurants**: email signup with OTP verification, optional Google Sign-In, role-based profiles, menu management, order placement, and live order updates over Socket.io.

## Features

| Role | Capabilities |
| ---- | ------------ |
| **Customer** | Browse restaurants and menus, place orders, track order status, view order history |
| **Restaurant** | Set open/closed/busy status, manage categories and menu items (with optional Cloudinary images), accept and progress orders on the dashboard |
| **Driver** | See available and assigned deliveries, update GPS location, pick up and complete orders |

**Shared:** JWT auth, profile setup per role, password change, account deletion, password reset via email OTP.

**Real-time:** Order create and status changes broadcast `order:update` to customers, restaurants, and drivers (pool for unassigned `PREPARING` orders).

## Tech stack

| Layer | Technologies |
| ----- | ------------ |
| **Frontend** | React 19, Vite 8, React Router 7, Fetch API, Socket.io client |
| **Backend** | Node.js, Express 5, Mongoose 9, Socket.io 4 |
| **Database** | MongoDB (Atlas or local) |
| **Auth** | JWT (7 days), bcrypt, 6-digit email OTP (10 min), optional Google Sign-In |
| **Email** | Nodemailer (Gmail or custom SMTP) |
| **Media** | Cloudinary (optional menu image uploads) |

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **MongoDB** — Atlas cluster or local instance
- **SMTP** (optional) — for OTP emails in signup and password reset
- **Google Cloud OAuth Web client** (optional) — for Google Sign-In
- **Cloudinary account** (optional) — for menu image uploads

## Quick start

From the **project root**:

```bash
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

1. Copy env files and fill in required values (see [Environment](#environment)).
2. Start both servers:

```bash
npm start
```

| Service | URL |
| ------- | --- |
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| Health (JSON) | http://localhost:5000/api/health |
| Health (plain text) | http://localhost:5000/ |

Wait until the terminal shows **`Server running on port 5000`** and **`MongoDB connected`** before using signup or forgot password. If the frontend loads before the API is ready, you may briefly see a network error — refresh and try again.

### Run separately (optional)

**Backend** (`backend/`):

```bash
cp .env.example .env   # Windows: copy .env.example .env
npm run dev
```

**Frontend** (`frontend/`):

```bash
npm run dev
```

Vite proxies **`/api`** and **`/socket.io`** to `http://localhost:5000` by default. In production, set `VITE_API_BASE_URL` to your deployed API origin (same host Socket.io uses).

## Environment

### Backend (`backend/.env`)

Copy from `backend/.env.example`.

| Variable | Required | Purpose |
| -------- | -------- | ------- |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Signs login tokens (32+ random chars); server exits if missing |
| `SMTP_USER`, `SMTP_PASS` | For real email | OTP signup and password reset emails |
| `SMTP_SERVICE` | Optional | e.g. `gmail` (see `.env.example` for App Password steps) |
| `GOOGLE_CLIENT_ID` | Optional | `POST /api/auth/google` |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Optional | `POST /api/menu/upload-image` |
| `MONGO_USE_SYSTEM_DNS` | Optional | Set to `1` on Windows if SRV DNS issues persist |
| `PORT` | Optional | API port (default `5000`) |

Without SMTP, OTP codes are still generated but may only appear in the **backend terminal** — useful for local testing.

### Frontend

| Variable | Where | Purpose |
| -------- | ----- | ------- |
| `VITE_GOOGLE_CLIENT_ID` | `frontend/.env` or `backend/.env` | Google button (`vite.config.js` merges backend env) |
| `VITE_API_BASE_URL` | `frontend/.env` | Production API URL (dev uses proxy; leave empty) |
| `VITE_API_PROXY_TARGET` | `frontend/.env` | Dev proxy target if not `localhost:5000` |

## Authentication flows

All email OTP codes are **6 digits**, valid for **10 minutes**.

Password rules (signup, reset, change password): at least **8** characters, **one digit**, **one symbol**.

### Sign up (email)

1. **`/`** — email, password, role (customer / driver / restaurant)
2. **`/verify-otp`** — 6-digit code; on success you receive a JWT and continue to setup
3. **`/setup/{role}`** — required profile fields for that role
4. **Role dashboard** — after profile is complete

### Sign up / log in (Google)

- Skips email OTP; new users can pass **`role`** on signup (defaults to `customer`).
- Still requires profile setup when details are incomplete.
- Returning users with an incomplete profile are sent to setup before the dashboard.

### Forgot password

1. **`/login`** → **Forgot password?** → **`/forgot-password`**
2. **`/reset-password`** — code, timer, resend, new password + confirm
3. **`/login`** — sign in with the new password

After submitting email on forgot password, you go directly to the reset code screen (no separate “check your email” page).

## Order lifecycle

Status flow:

`PLACED` → `ACCEPTED` → `PREPARING` → `PICKED_UP` → `DELIVERED`

Orders can be **`CANCELLED`** from allowed states (rules differ by role). See [`backend/doc/orders.md`](backend/doc/orders.md) for transition matrix and API details.

## Frontend routes

### Public (auth)

| Path | Page |
| ---- | ---- |
| `/` | Sign up |
| `/login` | Log in |
| `/verify-otp` | Signup OTP verification |
| `/forgot-password` | Request password reset |
| `/reset-password` | Reset code + new password |

### Protected (JWT + complete profile where noted)

| Path | Role | Page |
| ---- | ---- | ---- |
| `/setup/customer` | customer | Profile setup |
| `/setup/driver` | driver | Profile setup |
| `/setup/restaurant` | restaurant | Profile setup |
| `/dashboard` | any | Redirects to role home |
| `/customer/dashboard` | customer | Customer home |
| `/customer/restaurants` | customer | Browse restaurants |
| `/customer/restaurant/:id` | customer | Menu and checkout |
| `/customer/orders` | customer | Order list |
| `/customer/orders/:id` | customer | Order details |
| `/driver/dashboard` | driver | Active deliveries, location, status updates |
| `/driver/history` | driver | Past orders |
| `/driver/earnings` | driver | Earnings (placeholders) |
| `/restaurant/dashboard` | restaurant | Incoming orders, status actions |
| `/restaurant/menu` | restaurant | Menu list |
| `/restaurant/menu/create` | restaurant | Add menu item |
| `/restaurant/menu/edit/:id` | restaurant | Edit menu item |
| `/restaurant/categories` | restaurant | Categories |

## API overview

**Base URL (development):** `http://localhost:5000`

| Prefix | Purpose |
| ------ | ------- |
| `/` | Plain-text health |
| `/api/health` | JSON health + MongoDB connection state |
| `/api/auth` | Signup, verify OTP, login, Google, forgot/reset password |
| `/api/customer` | Profile CRUD, password change, account delete |
| `/api/restaurant` | Restaurant status; customer browse (`GET /`, `GET /:id`) |
| `/api/menu`, `/api/category` | Restaurant menu CRUD; customer menu (`GET /menu/restaurant/:restaurantId`) |
| `/api/driver` | Driver GPS location |
| `/api/orders` | Create, list, get, update order status |

Protected routes use `Authorization: Bearer <JWT>`.

**Socket.io** (same host/port): event `order:update` with `{ orderId, status, updatedAt }`. Connect with JWT via query `?token=`, `auth.token`, or `Authorization` header. Implementation: `backend/socket/index.js`, `frontend/src/socket.js`.

Full request/response reference:

| Document | Description |
| -------- | ----------- |
| [`backend/doc/API.md`](backend/doc/API.md) | Auth, profile, health, env notes |
| [`backend/doc/restaurant.md`](backend/doc/restaurant.md) | Menu, categories, status, customer browse |
| [`backend/doc/driver.md`](backend/doc/driver.md) | Driver location |
| [`backend/doc/orders.md`](backend/doc/orders.md) | Orders REST + Socket.io |

## Project structure

```
food-delivery-project/
├── package.json              # npm start → backend + frontend (concurrently)
├── backend/
│   ├── .env.example
│   ├── doc/                  # API documentation (Markdown)
│   ├── socket/               # Socket.io server + order:update emitter
│   └── src/
│       ├── server.js         # Express app, routes, HTTP server
│       ├── routes/           # auth, customer, menu, category, restaurant, driver, orders
│       ├── controllers/
│       ├── models/
│       ├── services/
│       ├── middleware/
│       └── config/           # db, email, cloudinary
└── frontend/
    ├── .env.example
    ├── vite.config.js        # API proxy, env merge, Google client ID
    └── src/
        ├── api/              # auth, profile, menu, restaurant, orders, driver, category
        ├── socket.js         # Socket.io client
        ├── components/       # auth, OTP, layouts, ProtectedRoute
        └── pages/            # auth, setup, role dashboards
```

## Scripts

| Location | Command | Description |
| -------- | ------- | ----------- |
| Root | `npm start` / `npm run dev` | Run backend + frontend together |
| `backend/` | `npm run dev` | API with nodemon |
| `backend/` | `npm start` | API without nodemon |
| `frontend/` | `npm run dev` | Vite dev server |
| `frontend/` | `npm run build` | Production build |

## Troubleshooting

### “Failed to fetch” or Vite `ECONNREFUSED` on `/api/...`

The backend is not running or not ready yet. Use `npm start` from the project root and wait for `Server running on port 5000`. Do not start a second backend if port 5000 is already in use (`EADDRINUSE`).

### OTP email not received

1. Configure `SMTP_USER` and `SMTP_PASS` in `backend/.env` (Gmail needs an [App Password](https://myaccount.google.com/apppasswords)).
2. Restart the backend after changing `.env`.
3. Check the backend terminal for the code when SMTP is not configured.

### Google Sign-In does not appear

Set `GOOGLE_CLIENT_ID` in `backend/.env` or `VITE_GOOGLE_CLIENT_ID` in `frontend/.env`, restart Vite, and add `http://localhost:5173` to authorized JavaScript origins in Google Cloud Console.

### MongoDB connection errors on Windows

If `mongodb+srv` SRV lookup fails, the backend uses public DNS by default. Set `MONGO_USE_SYSTEM_DNS=1` in `backend/.env` to use system DNS instead.

### Order updates not appearing live

Ensure the backend is running (Socket.io shares its port). In dev, the frontend must use the Vite proxy so `/socket.io` reaches port 5000. After login, dashboards call `connectSocket()` with the stored JWT.

### Only one terminal for dev

From the repo root, `npm start` runs both servers with `concurrently`. You should see `[0]` (backend) and `[1]` (frontend) log lines in the same window.
