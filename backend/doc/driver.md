# Driver APIs

These endpoints support **driver live location** updates. Driver profile read/write (except location) uses the shared **`/profile`** routes documented in [`API.md`](API.md).

Mounted in `server.js` at **`/api/driver`**.

## Authentication and role

Every route below requires:

1. **Header:** `Authorization: Bearer <JWT>`
2. **User role:** `driver` (enforced by `roleMiddleware(["driver"])`)

Requests without a valid token receive **401**. Authenticated users with another role receive **403**.

The authenticated user’s MongoDB `_id` is stored as **`userId`** on `DriverProfile`.

---

## Base URL (default server)

Assume the API host is `http://localhost:5000` (or your deployed host).

| Area     | Base path      |
| -------- | -------------- |
| Driver   | `/api/driver`  |

---

## Update location

Updates the driver’s current GPS coordinates on their profile.

### `PATCH /api/driver/location`

**Body (JSON):**

| Field | Type   | Required | Notes                    |
| ----- | ------ | -------- | ------------------------ |
| `lat` | number | yes      | Must be a finite number  |
| `lng` | number | yes      | Must be a finite number  |

**Example request**

```json
{
  "lat": 40.7128,
  "lng": -74.006
}
```

**Response (200):**

```json
{
  "profile": {
    "_id": "...",
    "userId": "...",
    "username": "driver1",
    "phone": "+15559876543",
    "vehicleType": "Bike",
    "vehicleNumber": "ABC-123",
    "licenseNumber": "D1234567",
    "availabilityStatus": "offline",
    "ratingAverage": 0,
    "ratingCount": 0,
    "location": {
      "lat": 40.7128,
      "lng": -74.006
    },
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Errors:**

| Status | Condition | Example `message` |
| ------ | --------- | ----------------- |
| **400** | Missing or non-numeric `lat`/`lng` | `"lat and lng must be valid numbers"` |
| **404** | No `DriverProfile` for this user | `"Driver profile not found"` |
| **401** | No / invalid token | `"Unauthorized"` |
| **403** | Wrong role | Forbidden |

---

## Profile (shared routes)

Drivers use the same profile endpoints as other roles (see [`API.md`](API.md)):

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `GET` | `/profile` | Returns `DriverProfile` for the logged-in driver |
| `POST` | `/profile/complete` | Upsert driver profile (username, phone, vehicle fields) |
| `POST` | `/profile/password` | Update password |
| `DELETE` | `/profile` | Delete profile and account |

`GET /profile` returns:

```json
{ "profile": { ... } }
```

---

## Frontend (driver dashboard)

| Route | Role | Page |
| ----- | ---- | ---- |
| `/driver/dashboard` | `driver` | `DriverDashboard.jsx` — welcome info, earnings placeholders, manual location update, placeholder actions |

Client helper: `frontend/src/api/driver.js` → `updateLocation(lat, lng)`.

---

## Related data model

**`DriverProfile`** fields (summary):

- `userId` (ref `User`, unique)
- `username`, `phone`, `vehicleType`, `vehicleNumber`, `licenseNumber`
- `availabilityStatus`: `"online"` \| `"offline"` (default `"offline"`)
- `ratingAverage`, `ratingCount`
- `location`: optional `{ lat: Number, lng: Number }`
- `createdAt`, `updatedAt`

---

## Error shape

Failures typically return JSON:

```json
{ "message": "Human-readable reason" }
```

Status codes: **400** validation, **401** unauthorized, **403** forbidden role, **404** not found, **500** unexpected server error.
