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

JWT is issued by `POST /api/auth/login`. Payload claims (signed with `process.env.JWT_SECRET`, expires in **7 days**):

- `id`: MongoDB User `_id` (string ObjectId from Mongoose serialization)
- `role`: `"customer"` | `"driver"` | `"restaurant"`

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

## Authentication (`/api/auth`)

Mounted in `backend/src/server.js` as `/api/auth` + router paths below.

---

### POST `/api/auth/signup`

**Full path:** `http://localhost:5000/api/auth/signup`

**Description:** Create a pending user (hashes password), create a verification token (24h), and trigger verification delivery (SMTP if configured; otherwise verification URL is logged on the server — see Notes).

**Request body**

| Field       | Type   | Required | Notes                                      |
|------------|--------|----------|--------------------------------------------|
| `email`    | string | yes      | Normalized/stored lowercase                |
| `password` | string | yes      | Stored hashed                               |
| `role`     | string | yes      | One of `customer`, `driver`, `restaurant` |

**Example request**

```json
{
  "email": "user@example.com",
  "password": "secret",
  "role": "customer"
}
```

**Success response**

- Status: **201 Created**

```json
{
  "message": "Verification email sent"
}
```

**Error responses (non-exhaustive)**

| Condition                                      | Typical status | Example `message` |
|-----------------------------------------------|----------------|-------------------|
| Missing fields                               | **400**        | `"email, password, and role are required"` |
| Invalid `role`                               | **400**        | `"Invalid role"` |
| Email exists and user is verified            | **409**        | `"Email already registered"` |
| Unexpected / DB / hashing                    | **500**        | Varies |

**Repeat signup (unverified email)**

If the email already exists and `isVerified` is `false`, the server rotates verification tokens for that user and returns **201** with the same success body (`"Verification email sent"`).

**Notes**

- User is created with `accountStatus: "pending"` and `isVerified: false` until email verification succeeds.
- Verification URL format (included in outgoing email text when SMTP is configured):  
  `{APP_BASE_URL}/api/auth/verify/{token}`  
  Defaults: `APP_BASE_URL` = `http://localhost:5000` if unset.
- SMTP env vars (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`); if incomplete, signup still succeeds but email is skipped and you should read the verification link from the server console logs.

---

### GET `/api/auth/verify/:token`

**Full path:** `http://localhost:5000/api/auth/verify/:token`

**Example:**  
`http://localhost:5000/api/auth/verify/abc123…`

**Description:** Validates the verification token, marks the user verified, sets `accountStatus` to `active`, and deletes verification tokens for that user.

**Path params**

| Param   | Type   | Notes                    |
|---------|--------|--------------------------|
| `token` | string | Stored verification token|

**Success response**

- Status: **200 OK**

```json
{
  "message": "Email verified successfully"
}
```

**Error responses (non-exhaustive)**

| Condition                    | Typical status | Example `message` |
|------------------------------|----------------|-------------------|
| Token missing               | **400**        | `"Verification token is required"` |
| Unknown token               | **400**        | `"Invalid verification token"` |
| Expired token               | **400**        | `"Verification token expired"` |
| User missing                | **404**        | `"User not found"` |
| Unexpected                  | **500**        | Varies |

---

### POST `/api/auth/login`

**Full path:** `http://localhost:5000/api/auth/login`

**Description:** Validates credentials and returns a JWT plus a password-free user snapshot.

**Request body**

| Field       | Type   | Required |
|------------|--------|----------|
| `email`    | string | yes      |
| `password` | string | yes      |

**Example request**

```json
{
  "email": "user@example.com",
  "password": "secret"
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
| Email not verified                             | **403**        | `"Email not verified"` |
| Account not active (`pending` / `suspended`)   | **403**        | `"Account is pending"` / `"Account is suspended"` etc. |
| Unexpected                                     | **500**        | Varies |

---

## Profile (`/api/profile`)

Mounted in `backend/src/server.js` as `/api/profile` + router paths below.

---

### POST `/api/profile/complete`

**Full path:** `http://localhost:5000/api/profile/complete`

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

## Endpoint summary

| Method | Exact path                               | Auth | Purpose |
|--------|------------------------------------------|------|---------|
| `GET`  | `http://localhost:5000/`                 | none | Health (plain text) |
| `POST` | `http://localhost:5000/api/auth/signup` | none | Sign up + send verification |
| `GET`  | `http://localhost:5000/api/auth/verify/:token` | none | Verify email |
| `POST` | `http://localhost:5000/api/auth/login` | none | Login + JWT |
| `POST` | `http://localhost:5000/api/profile/complete` | Bearer JWT | Upsert profile by role |

---

## Environment notes (referenced by APIs)

Required for persistence / auth email flow:

- **`MONGO_URI`** — MongoDB connection string (`backend/src/config/db.js`).
- **`JWT_SECRET`** — required for issuing/verifying JWTs (`generateToken.js`, `authMiddleware.js`). If unset, `/login` signing or middleware verification can fail server-side.

Optional email / URLs:

- **`APP_BASE_URL`** — verification link prefix in outbound email (`backend/src/services/emailService.js`).
- **`SMTP_*`** — when all of `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` are set, verification email is sent; otherwise the verification URL is only logged (`emailService.js`).

Optional Windows DNS override for Node SRV lookups:

- **`MONGO_USE_SYSTEM_DNS=1`** — disables forcing public DNS servers in `server.js` (`MONGO_USE_SYSTEM_DNS`).
