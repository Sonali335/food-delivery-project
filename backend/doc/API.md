# Food delivery backend — REST API reference

**Document location (this file):**

`backend/doc/API.md`

**API base URL (development):**

`http://localhost:5000`

**Default JSON rules**

- Requests that send JSON use header:  
  `Content-Type: application/json`
- Responses are JSON unless noted otherwise.
- Error bodies use this shape unless stated otherwise:

```json
{ "message": "Human-readable error description" }
```

**Authentication**

- Protected routes expect:

```http
Authorization: Bearer <JWT>
```

JWT is issued by **`POST /auth/login`** and **`POST /auth/google`** (same token shape). **`POST /auth/signup`** does **not** return a JWT; the client must verify email with OTP, then log in.

Payload claims (signed with `process.env.JWT_SECRET`, expires in **7 days**):

- `id`: MongoDB User `_id` (string ObjectId from Mongoose serialization)
- `role`: `"customer"` | `"driver"` | `"restaurant"`

**User model (auth-related):** `password` may be `null` for Google-created accounts. Email/password users have a bcrypt-hashed `password`.

**Password policy** (enforced on **`POST /auth/signup`**, **`POST /auth/reset-password`**, and **`POST /profile/password`**):

- At least **8** characters  
- At least **one digit** (`0–9`)  
- At least **one symbol** (any character that is not a letter or digit, e.g. `!@#$%`)

---

## Health

### GET `/`

**Full path:** `http://localhost:5000/`

**Description:** Lightweight health check.

**Response**

- Status: **200 OK**
- Body: plain text (not JSON)

Example:

```
API is running...
```

---

## Authentication (`/auth`)

Mounted in `backend/src/server.js` as `/auth` + router paths below.

---

### POST `/auth/signup`

**Full path:** `http://localhost:5000/auth/signup`

**Description:** Does **not** create a `User` yet. Validates the password policy, checks the email is not already registered as a **User**, then **upserts** a **`PendingSignup`** row (email, bcrypt-hashed password, role, bcrypt-hashed **6-digit OTP**, `expiresAt` **10 minutes** from creation). Sends the plain OTP by email when SMTP is configured (otherwise the server logs a dev fallback). **No JWT** is returned.

**Request body**

| Field       | Type   | Required | Notes                                      |
|------------|--------|----------|--------------------------------------------|
| `email`    | string | yes      | Normalized/stored lowercase                |
| `password` | string | yes      | Must meet password policy (see above)       |
| `role`     | string | yes      | One of `customer`, `driver`, `restaurant` |

**Example request**

```json
{
  "email": "user@example.com",
  "password": "Secret1!",
  "role": "customer"
}
```

**Success response**

- Status: **201 Created**

```json
{
  "message": "OTP sent to your email for verification.",
  "otpExpiresAt": "2026-05-12T12:10:00.000Z"
}
```

`otpExpiresAt` is an ISO 8601 timestamp when the OTP expires (same moment as `PendingSignup.expiresAt`).

**Error responses (non-exhaustive)**

| Condition                                      | Typical status | Example `message` |
|-----------------------------------------------|----------------|-------------------|
| Missing fields                               | **400**        | `"email, password, and role are required"` |
| Invalid `role`                               | **400**        | `"Invalid role"` |
| Password policy failure                        | **400**        | e.g. `"Password must contain at least one number"` |
| Email already registered (`User` exists)      | **409**        | `"Email already registered"` |
| SMTP send failure (when configured)            | **500**        | Varies (e.g. Gmail credential errors) |
| Unexpected / DB / hashing                      | **500**        | Varies |

---

### POST `/auth/verify-otp`

**Full path:** `http://localhost:5000/auth/verify-otp`

**Description:**  

1. **Primary flow:** If a **`PendingSignup`** exists for the email, validates the OTP and expiry. On success: creates **`User`** with `isVerified: true`, `accountStatus: "active"`, deletes the pending row. **Does not issue a JWT** — the client should call **`POST /auth/login`** afterward.  

2. **Legacy flow:** If no `PendingSignup` but a **`User`** exists with a signup **`OtpVerification`** record (`purpose` `signup` or legacy docs without `purpose`), the previous verify behavior still applies (activate user, clear signup OTPs).

**Request body**

| Field   | Type   | Required | Notes                    |
|---------|--------|----------|--------------------------|
| `email` | string | yes      | Same email used at signup |
| `otp`   | string | yes      | 6-digit code (string ok) |

**Success response**

- Status: **200 OK**

```json
{
  "message": "Email verified successfully."
}
```

**Error responses (non-exhaustive)**

| Condition | Typical status | Example `message` |
|-----------|----------------|-------------------|
| Missing fields | **400** | `"email and otp are required"` |
| Unknown email / bad OTP / expired | **400** | Various (e.g. `"Invalid verification code"`, `"Verification code has expired. Sign up again."`) |
| Race: email became registered | **409** | `"Email already registered"` |

---

### POST `/auth/login`

**Full path:** `http://localhost:5000/auth/login`

**Description:** Validates email/password. Requires **`isVerified === true`** and **`accountStatus === "active"`**. Returns a JWT plus a password-free user snapshot.

**Request body**

| Field       | Type   | Required |
|------------|--------|----------|
| `email`    | string | yes      |
| `password` | string | yes      |

**Example request**

```json
{
  "email": "user@example.com",
  "password": "Secret1!"
}
```

**Success response**

- Status: **200 OK**

```json
{
  "user": {
    "_id": "…",
    "email": "user@example.com",
    "role": "customer",
    "isVerified": true,
    "accountStatus": "active",
    "lastLogin": "2026-05-09T03:41:22.456Z",
    "createdAt": "…",
    "updatedAt": "…",
    "__v": 0
  },
  "token": "<JWT string>"
}
```

**Error responses (non-exhaustive)**

| Condition                                       | Typical status | Example `message` |
|------------------------------------------------|----------------|-------------------|
| Missing email/password                         | **400**        | `"email and password are required"` |
| Wrong email/password                          | **401**        | `"Invalid credentials"` |
| Email not verified (`isVerified` false)        | **403**        | `"Account not verified. Please verify your email."` |
| Account not active (`pending` / `suspended`)   | **403**        | `"Account is pending"` / `"Account is suspended"` etc. |
| Google-only account (no password stored)       | **401**        | `"This account uses Google sign-in."` |
| Unexpected                                     | **500**        | Varies |

---

### POST `/auth/google`

**Full path:** `http://localhost:5000/auth/google`

**Description:** Verifies a **Google ID token** (`google-auth-library`), finds or creates the user by email, ensures the account is not **suspended**, and returns a JWT. New Google users are created as **`customer`**, **`isVerified: true`**, **`accountStatus: "active"`**, with a basic **CustomerProfile** (no OTP). Any **`PendingSignup`** for the same email is removed so it does not block Google sign-in. Existing users with `pending` / unverified state are upgraded to verified + active.

**Request body**

| Field      | Type   | Required | Notes                                      |
|-----------|--------|----------|--------------------------------------------|
| `idToken` | string | yes      | Credential JWT from Google Identity Services |

**Success response**

- Status: **200 OK**

```json
{
  "token": "<JWT string>",
  "role": "customer"
}
```

**Error responses (non-exhaustive)**

| Condition | Typical status | Example `message` |
|-----------|----------------|-------------------|
| Missing `idToken` | **400** | `"idToken is required"` |
| `GOOGLE_CLIENT_ID` unset | **503** | `"Google sign-in is not configured"` |
| Invalid / expired token | **401** | `"Invalid Google token"` |
| Account suspended | **403** | `"Account is suspended"` |

**Environment:** `GOOGLE_CLIENT_ID` — OAuth 2.0 **Web** client ID (must match the client used to obtain `idToken`).

---

### POST `/auth/forgot-password`

**Full path:** `http://localhost:5000/auth/forgot-password`

**Description:** If a **User** exists for the email, has a **password** (not Google-only), and is **not suspended**, deletes prior **password-reset** OTP rows, creates a new **6-digit OTP** in **`OtpVerification`** (`purpose: "password_reset"`, **10 minute** expiry), and emails the code when SMTP is configured. Response message is always the same generic text (does not reveal whether the email exists).

**Request body**

| Field   | Type   | Required |
|---------|--------|----------|
| `email` | string | yes      |

**Success response**

- Status: **200 OK**

When a reset email was actually sent:

```json
{
  "message": "If an account exists with that email, a reset code was sent.",
  "otpExpiresAt": "2026-05-12T12:10:00.000Z"
}
```

When no email was sent (unknown email, Google-only account, suspended, etc.):

```json
{
  "message": "If an account exists with that email, a reset code was sent."
}
```

(No `otpExpiresAt` field — clients should not show a misleading countdown.)

**Error responses**

| Condition | Typical status |
|-----------|----------------|
| Missing `email` | **400** |

---

### POST `/auth/reset-password`

**Full path:** `http://localhost:5000/auth/reset-password`

**Description:** Validates the latest **password_reset** OTP for the user, checks expiry, enforces the **password policy** on `newPassword`, updates the user’s bcrypt password, sets **`isVerified: true`** and **`accountStatus: "active"`** if they were still pending, and clears password-reset and signup OTP rows for that user.

**Request body**

| Field          | Type   | Required |
|----------------|--------|----------|
| `email`        | string | yes      |
| `otp`          | string | yes      |
| `newPassword`  | string | yes      |

**Success response**

- Status: **200 OK**

```json
{
  "message": "Password updated. You can log in with your new password."
}
```

**Error responses (non-exhaustive)**

| Typical status | Example `message` |
|----------------|-------------------|
| **400** | `"email, otp, and newPassword are required"` |
| **400** | Password policy messages (same as signup) |
| **400** | `"Invalid email or reset code"` / `"Reset code has expired"` |

---

## Profile (`/profile`)

Mounted in `backend/src/server.js` as `/profile` + router paths below.

---

### GET `/profile`

**Full path:** `http://localhost:5000/profile`

**Description:** Returns the profile document for the authenticated user’s role (`CustomerProfile`, `DriverProfile`, or `RestaurantProfile`).

**Protected:** Requires `Authorization: Bearer <JWT>`.

**Success response**

- Status: **200 OK**

```json
{
  "profile": { … }
}
```

**Error responses**

| Condition | Typical status | Body |
|-----------|----------------|------|
| No profile yet for this user | **404** | `{ "message": "Profile not found" }` |
| Unsupported role | **400** / **500** | Per middleware / service |

---

### POST `/profile/complete`

**Full path:** `http://localhost:5000/profile/complete`

**Description:** Upserts (`findOneAndUpdate` with upsert) the profile document matching the authenticated user’s `role`.  
**Protected:** Requires `Authorization: Bearer <JWT>`.

**Middleware behavior**

| Case                         | Response |
|-----------------------------|-----------|
| No / invalid Bearer token    | **401** `{ "message": "Unauthorized" }` |

**Routing by role**

Server reads `req.user.role` after JWT verification:

- `customer` → `completeCustomerProfile`
- `driver` → `completeDriverProfile`
- `restaurant` → `completeRestaurantProfile`

If JWT decodes successfully but stored role does not match the three enums above (should not normally happen):

- Status: **400**
- Body: `{ "message": "Unsupported role" }`

---

#### Customer body

**Requirement:** JWT user `role === "customer"`.

**Request body**

| Field         | Type     | Required | Notes |
|--------------|----------|----------|-------|
| `username`   | string   | yes      | |
| `phone`      | string   | yes      | |
| `addresses` | array    | yes      | Array of objects (can be empty only if validators allow; service requires truthy username/phone — **addresses must exist as an array**) |

Each address element:

| Field         | Type   | Required |
|--------------|--------|----------|
| `label`      | string | yes      |
| `street`     | string | yes      |
| `city`       | string | yes      |
| `state`      | string | yes      |
| `postalCode` | string | yes      |

**Example request**

```json
{
  "username": "jdoe",
  "phone": "+15551234567",
  "addresses": [
    {
      "label": "Home",
      "street": "1 Main St",
      "city": "Springfield",
      "state": "IL",
      "postalCode": "62701"
    }
  ]
}
```

**Success response**

- Status: **200 OK**

```json
{
  "message": "Profile completed",
  "profile": {
    "_id": "…",
    "userId": "…",
    "username": "jdoe",
    "phone": "+15551234567",
    "addresses": [ … ],
    "profileImage": null,
    "createdAt": "…",
    "updatedAt": "…",
    "__v": 0
  }
}
```

**Service validation failures**

| Condition | Typical status | `message` |
|-----------|----------------|-----------|
| Missing `username` / `phone` / `addresses` not an array | **400** | `"username, phone, and addresses are required"` |

Mongoose address field validation failures may surface as **500** depending on middleware error handling.

---

#### Driver body

**Requirement:** JWT user `role === "driver"`.

**Request body**

| Field           | Type   | Required |
|----------------|--------|----------|
| `username`      | string | yes      |
| `phone`         | string | yes      |
| `vehicleType`   | string | yes      |
| `vehicleNumber` | string | yes      |
| `licenseNumber` | string | yes      |

**Example request**

```json
{
  "username": "driver1",
  "phone": "+15559876543",
  "vehicleType": "Bike",
  "vehicleNumber": "ABC-123",
  "licenseNumber": "D1234567"
}
```

**Success response**

- Status: **200 OK**

```json
{
  "message": "Profile completed",
  "profile": {
    "_id": "…",
    "userId": "…",
    "username": "driver1",
    "phone": "+15559876543",
    "vehicleType": "Bike",
    "vehicleNumber": "ABC-123",
    "licenseNumber": "D1234567",
    "availabilityStatus": "offline",
    "ratingAverage": 0,
    "ratingCount": 0,
    "createdAt": "…",
    "updatedAt": "…",
    "__v": 0
  }
}
```

**Service validation failures**

| Typical status | `message` |
|----------------|-----------|
| **400** | `"username, phone, vehicleType, vehicleNumber, and licenseNumber are required"` |

---

#### Restaurant body

**Requirement:** JWT user `role === "restaurant"`.

**Request body**

| Field            | Type   | Required |
|-----------------|--------|----------|
| `restaurantName`| string | yes      |
| `phone`         | string | yes      |
| `location`      | string | yes      |

**Example request**

```json
{
  "restaurantName": "Pizza Place",
  "phone": "+15551112222",
  "location": "123 Food Court"
}
```

**Success response**

- Status: **200 OK**

```json
{
  "message": "Profile completed",
  "profile": {
    "_id": "…",
    "userId": "…",
    "restaurantName": "Pizza Place",
    "phone": "+15551112222",
    "location": "123 Food Court",
    "cuisineType": null,
    "openingHours": null,
    "ratingAverage": 0,
    "ratingCount": 0,
    "createdAt": "…",
    "updatedAt": "…",
    "__v": 0
  }
}
```

**Service validation failures**

| Typical status | `message` |
|----------------|-----------|
| **400** | `"restaurantName, phone, location are required"` |

---

### POST `/profile/password`

**Full path:** `http://localhost:5000/profile/password`

**Description:** Updates the authenticated user’s password. If the user already has a password, **current password** must be correct. If `password` is `null` (e.g. Google-only), **current password** is not required — the user can set a password for the first time. **`newPassword`** must satisfy the global **password policy** (8+ chars, one number, one symbol).

**Protected:** Requires `Authorization: Bearer <JWT>`.

**Request body**

| Field              | Type   | Required | Notes |
|-------------------|--------|----------|-------|
| `currentPassword` | string | conditional | Required when user has an existing password |
| `newPassword`     | string | yes      | Password policy |
| `confirmPassword` | string | yes      | Must match `newPassword` |

**Success response**

- Status: **200 OK**

```json
{
  "message": "Password updated successfully."
}
```

**Error responses (non-exhaustive)**

| Typical status | Example `message` |
|----------------|---------------------|
| **400** | `"New password and confirmation do not match"` |
| **400** | `"Current password is required"` |
| **401** | `"Current password is incorrect"` |
| **400** | Password policy messages (e.g. `"Password must be at least 8 characters"`) |

---

### DELETE `/profile`

**Full path:** `http://localhost:5000/profile`

**Description:** Deletes the user’s role-specific profile document, all **`OtpVerification`** rows for that user, any **`PendingSignup`** row for the user’s email, and the **User** document (full account removal).

**Protected:** Requires `Authorization: Bearer <JWT>`.

**Success response**

- Status: **200 OK**

```json
{
  "message": "Profile and account deleted."
}
```

---

## Endpoint summary

| Method   | Exact path                                      | Auth | Purpose |
|----------|-------------------------------------------------|------|---------|
| `GET`    | `http://localhost:5000/`                        | none | Health (plain text) |
| `POST`   | `http://localhost:5000/auth/signup`           | none | Start email signup (`PendingSignup` + OTP email) |
| `POST`   | `http://localhost:5000/auth/verify-otp`         | none | Verify signup OTP → create `User` |
| `POST`   | `http://localhost:5000/auth/login`              | none | Login + JWT |
| `POST`   | `http://localhost:5000/auth/google`             | none | Google ID token → JWT |
| `POST`   | `http://localhost:5000/auth/forgot-password`  | none | Request password-reset OTP (generic response) |
| `POST`   | `http://localhost:5000/auth/reset-password`   | none | Submit reset OTP + new password |
| `GET`    | `http://localhost:5000/profile`                 | Bearer JWT | Get profile by role |
| `POST`   | `http://localhost:5000/profile/complete`      | Bearer JWT | Upsert profile by role |
| `POST`   | `http://localhost:5000/profile/password`      | Bearer JWT | Update password |
| `DELETE` | `http://localhost:5000/profile`                 | Bearer JWT | Delete profile + pending signup + user account |

---

## Environment notes (referenced by APIs)

**Required**

- **`MONGO_URI`** — MongoDB connection string (`backend/src/config/db.js`).
- **`JWT_SECRET`** — required for issuing/verifying JWTs (`generateToken.js`, `authMiddleware.js`). Server exits at startup if missing (`server.js`).

**Google Sign-In**

- **`GOOGLE_CLIENT_ID`** — OAuth 2.0 Web client ID; required for `POST /auth/google` (`authService.googleLogin`).

**Email (OTP signup, password reset)**

Nodemailer sends mail when SMTP is considered **configured** (`backend/src/config/email.js` + `emailService.js`):

- **Gmail shortcut:** `SMTP_SERVICE=gmail`, **`SMTP_USER`**, **`SMTP_PASS`** (use a Google **App Password**, not the normal Gmail password). Spaces in the app password are stripped automatically.
- **Custom SMTP:** set **`SMTP_HOST`**, **`SMTP_USER`**, **`SMTP_PASS`**; **`SMTP_PORT`** defaults to **587**; optional **`SMTP_SECURE`** (`"true"` for TLS on some hosts).

Optional:

- **`SMTP_FROM`** — `From` header (defaults to `SMTP_USER`).
- **`MAIL_APP_NAME`** — display name in HTML OTP emails (default `Food delivery`).

If SMTP is **not** configured, OTP values are **not** emailed; the server logs a **warning** with a dev fallback (`emailService.js`). Startup logs a hint when email is not configured.

**Optional Windows DNS override for Node SRV lookups**

- **`MONGO_USE_SYSTEM_DNS=1`** — disables forcing public DNS servers in `server.js`.

---

## Data model notes (auth-related)

- **`PendingSignup`** — email signup before verification: `email`, `passwordHash`, `role`, hashed `otp`, `expiresAt`. Removed after successful verify or when superseded by a new signup for the same email.
- **`OtpVerification`** — tied to **`userId`** for **password reset** (`purpose: "password_reset"`) and legacy **signup** OTPs (`purpose: "signup"` or missing `purpose`). Fields include hashed `otp`, `expiresAt`, `purpose`.
- **`User`** — created only after successful email OTP verification (new flow) or via **Google** sign-in.
