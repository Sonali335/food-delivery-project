# Food delivery

A web application that connects **customers**, **drivers**, and **restaurants** on one platform: sign up with email verification, manage menus, place orders, and track delivery.

## Tech stack

| Layer | Technologies |
| ----- | ------------ |
| **Frontend** | React 19, Vite, React Router, shared auth UI (`AuthLayout`), Fetch API, Socket.io client |
| **Backend** | Node.js, Express 5, Mongoose |
| **Database** | MongoDB (Atlas or local) |
| **Auth** | JWT, bcrypt, 6-digit email OTP (10 min), optional Google Sign-In |
| **Email** | Nodemailer (Gmail or custom SMTP) |
| **Media** | Cloudinary (optional, menu images) |

## Quick start

From the **project root** (runs backend + frontend together):

```bash
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

1. Copy env files and fill in required values (see [Environment](#environment) below).
2. Start both servers:

```bash
npm start
```

| Service | URL |
| ------- | --- |
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| Health check | http://localhost:5000/api/health |

Wait until the terminal shows **`Server running on port 5000`** and **`MongoDB connected`** before using signup or forgot password. If the frontend loads before the API is ready, you may briefly see a network error — refresh and try again.

### Run separately (optional)

**Backend** (`backend/`):

```bash
cp .env.example .env   # then edit MONGO_URI, JWT_SECRET, SMTP, etc.
npm run dev
```

**Frontend** (`frontend/`):

```bash
npm run dev
```

Vite proxies `/api` and `/socket.io` to `http://localhost:5000` by default. In production, set `VITE_API_BASE_URL` to your deployed API origin.

## Environment

### Backend (`backend/.env`)

Copy from `backend/.env.example`.

| Variable | Required | Purpose |
| -------- | -------- | ------- |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Signs login tokens (32+ random chars) |
| `SMTP_USER`, `SMTP_PASS` | For real email | OTP signup & password reset emails |
| `SMTP_SERVICE` | Optional | e.g. `gmail` (see `.env.example` for App Password steps) |
| `GOOGLE_CLIENT_ID` | Optional | Google Sign-In on login/signup |
| `CLOUDINARY_*` | Optional | Menu image uploads |

Without SMTP, OTP codes are still generated but may only appear in the **backend terminal** — useful for local testing.

### Frontend

| Variable | Where | Purpose |
| -------- | ----- | ------- |
| `VITE_GOOGLE_CLIENT_ID` | `frontend/.env` or `backend/.env` | Google button (Vite merges backend env) |
| `VITE_API_BASE_URL` | `frontend/.env` | Production API URL (dev uses proxy, leave empty) |
| `VITE_API_PROXY_TARGET` | `frontend/.env` | Dev proxy target if not `localhost:5000` |

## Authentication flows

All email OTP codes are **6 digits**, valid for **10 minutes**.

### Sign up (email)

1. **`/`** — email, password, role (customer / driver / restaurant)
2. **`/verify-otp`** — 6-digit code, then you are signed in automatically
3. **`/setup/{role}`** — required profile questions for that role
4. **Role dashboard** — only after profile is complete

Google sign-up skips OTP but still goes through profile setup if details are missing.

Returning users who log in without a complete profile are sent to the same setup screen before the dashboard.

### Forgot password

1. **`/login`** → **Forgot password?** → **`/forgot-password`** — enter email
2. **`/reset-password`** — 6-digit code, timer, resend, new password + confirm
3. **`/login`** — sign in with the new password

There is no separate “check your email” step; after submitting email you go directly to the code screen.

### Auth UI (frontend)

| File | Role |
| ---- | ---- |
| `frontend/src/pages/Signup.jsx` | Create account |
| `frontend/src/pages/OtpVerification.jsx` | Signup email verification |
| `frontend/src/pages/Login.jsx` | Login + link to forgot password |
| `frontend/src/pages/ForgotPassword.jsx` | Request reset code |
| `frontend/src/pages/ResetPassword.jsx` | Enter code + set new password |
| `frontend/src/components/OtpDigitInput.jsx` | Six digit inputs (auto-advance, paste) |
| `frontend/src/components/OtpResendTimer.jsx` | Countdown + resend |
| `frontend/src/components/auth/AuthLayout.jsx` | Shared card layout, back bar, hero icon |

## Frontend routes

### Public (auth)

| Path | Page |
| ---- | ---- |
| `/` | Sign up |
| `/login` | Log in |
| `/verify-otp` | Signup OTP verification |
| `/forgot-password` | Request password reset |
| `/reset-password` | Reset code + new password |

### Protected (JWT required)

| Path | Role | Page |
| ---- | ---- | ---- |
| `/setup/customer` | customer | Profile setup |
| `/setup/driver` | driver | Profile setup |
| `/setup/restaurant` | restaurant | Profile setup |
| `/dashboard` | any | Redirects to role home |
| `/customer/dashboard` | customer | Customer dashboard |
| `/customer/restaurants` | customer | Browse restaurants |
| `/customer/restaurant/:id` | customer | Menu & order |
| `/customer/orders` | customer | Order list |
| `/customer/orders/:id` | customer | Order details |
| `/driver/dashboard` | driver | Driver dashboard |
| `/driver/history` | driver | Order history |
| `/driver/earnings` | driver | Earnings (placeholders) |
| `/restaurant/dashboard` | restaurant | Restaurant dashboard |
| `/restaurant/menu` | restaurant | Menu list |
| `/restaurant/menu/create` | restaurant | Add menu item |
| `/restaurant/menu/edit/:id` | restaurant | Edit menu item |
| `/restaurant/categories` | restaurant | Categories |

## API overview

**Base URL (development):** `http://localhost:5000`

| Prefix | Purpose |
| ------ | ------- |
| `/api/auth` | Signup, verify OTP, login, Google, forgot/reset password |
| `/api/customer` | Profile CRUD, password change |
| `/api/restaurant` | Restaurant status |
| `/api/menu`, `/api/category` | Menu & categories |
| `/api/driver` | Driver location |
| `/api/orders` | Orders lifecycle |

Full request/response details: [`backend/doc/API.md`](backend/doc/API.md)

## Documentation

| Document | Description |
| -------- | ----------- |
| [`backend/doc/API.md`](backend/doc/API.md) | Auth, profile, health |
| [`backend/doc/restaurant.md`](backend/doc/restaurant.md) | Menu, categories, restaurant status, customer browse |
| [`backend/doc/driver.md`](backend/doc/driver.md) | Driver location API |
| [`backend/doc/orders.md`](backend/doc/orders.md) | Order lifecycle API |

## Project structure

```
food-delivery-project/
├── package.json          # npm start → backend + frontend
├── backend/
│   ├── .env.example
│   ├── doc/              # API documentation
│   └── src/
│       ├── routes/       # auth, customer, menu, category, restaurant, driver, orders
│       ├── controllers/
│       ├── models/
│       ├── services/     # auth, email, orders, menu, …
│       └── config/       # db, email, cloudinary
└── frontend/
    ├── .env.example
    └── src/
        ├── api/          # auth, profile, menu, orders, …
        ├── components/   # auth, OTP, protected route, shells
        └── pages/        # auth + role dashboards
```

## Troubleshooting

### “Failed to fetch” or Vite `ECONNREFUSED` on `/api/...`

The backend is not running or not ready yet. Use `npm start` from the project root and wait for `Server running on port 5000`. Do not start a second backend if port 5000 is already in use (`EADDRINUSE`).

### OTP email not received

1. Configure `SMTP_USER` and `SMTP_PASS` in `backend/.env` (Gmail needs an [App Password](https://myaccount.google.com/apppasswords)).
2. Restart the backend after changing `.env`.
3. Check the backend terminal for the code when SMTP is not configured.

### Google Sign-In does not appear

Set `GOOGLE_CLIENT_ID` in `backend/.env` or `VITE_GOOGLE_CLIENT_ID` in `frontend/.env`, restart Vite, and add `http://localhost:5173` to authorized origins in Google Cloud Console.

### Only one terminal for dev

From the repo root, `npm start` runs both servers with `concurrently`. You should see `[0]` (backend) and `[1]` (frontend) log lines in the same window.
