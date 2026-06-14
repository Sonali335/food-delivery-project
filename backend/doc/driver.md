# Driver APIs

These endpoints support **driver live location**, **online/offline availability**, and real-time location broadcast to restaurants. Driver profile read/write (except location and availability) uses the shared **`/api/customer`** routes documented in [`API.md`](API.md).

Mounted in `server.js` at **`/api/driver`**.

## Authentication and role

Every route below requires:

1. **Header:** `Authorization: Bearer <JWT>`
2. **User role:** `driver` (enforced by `roleMiddleware(["driver"])`)

Requests without a valid token receive **401**. Authenticated users with another role receive **403**.

The authenticated user’s MongoDB `_id` is stored as **`userId`** on `DriverProfile` and matches **`driverId`** on assigned orders.

---

## Base URL (default server)

Assume the API host is `http://localhost:5000` (or your deployed host).

| Area   | Base path     |
| ------ | ------------- |
| Driver | `/api/driver` |

---

## Update location

Updates the driver’s current GPS coordinates on their profile and broadcasts location to restaurants with active orders for this driver.

### `PATCH /api/driver/location`

**Body (JSON):**

| Field | Type   | Required | Notes                   |
| ----- | ------ | -------- | ----------------------- |
| `lat` | number | yes      | Must be a finite number |
| `lng` | number | yes      | Must be a finite number |

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

**Side effects**

After a successful save, the server emits **`driver:location`** to each `restaurant:<restaurantId>` room for orders where:

- `driverId` equals this driver, and
- `status` is `ACCEPTED`, `PREPARING`, or `PICKED_UP`

See [Real-time: driver location](#real-time-driver-location).

**Errors:**

| Status | Condition | Example `message` |
| ------ | --------- | ----------------- |
| **400** | Missing or non-numeric `lat`/`lng` | `"lat and lng must be valid numbers"` |
| **404** | No `DriverProfile` for this user | `"Driver profile not found"` |
| **401** | No / invalid token | `"Unauthorized"` |
| **403** | Wrong role | Forbidden |

---

## Update availability

Sets whether the driver is **online** and eligible to receive unassigned pool orders.

### `PATCH /api/driver/availability`

**Body (JSON):**

| Field                | Type   | Required | Notes                          |
| -------------------- | ------ | -------- | ------------------------------ |
| `availabilityStatus` | string | yes      | `"online"` or `"offline"` only |

**Example request**

```json
{
  "availabilityStatus": "online"
}
```

**Response (200):**

```json
{
  "profile": {
    "_id": "...",
    "userId": "...",
    "username": "driver1",
    "availabilityStatus": "online",
    "...": "..."
  }
}
```

**Side effects**

1. Emits **`driver:availability`** to `driver:<driverId>`:

```json
{
  "driverId": "507f1f77bcf86cd799439011",
  "availabilityStatus": "online"
}
```

2. Updates Socket.io pool membership for connected driver sockets:
   - **`online`** → join room `drivers:pool`
   - **`offline`** → leave room `drivers:pool`

**Errors:**

| Status | Condition | Example `message` |
| ------ | --------- | ----------------- |
| **400** | Invalid status | `'availabilityStatus must be "online" or "offline"'` |
| **404** | No profile | `"Driver profile not found"` |

---

## Effect on `GET /api/orders/driver`

| `availabilityStatus` | Orders returned |
| -------------------- | --------------- |
| **`online`** | Assigned orders **plus** unassigned orders with `status === "PREPARING"` and `driverId === null` (pool) |
| **`offline`** | **Only** orders where `driverId` is this driver (no pool orders) |

Default for new profiles is **`offline`**.

---

## Real-time: driver location

### Event: `driver:location`

Emitted to **`restaurant:<restaurantId>`** when a driver updates location (via **`PATCH /api/driver/location`**) and has active assigned orders.

**Payload:**

```json
{
  "driverId": "507f1f77bcf86cd799439011",
  "orderId": "507f1f77bcf86cd799439012",
  "lat": 40.7128,
  "lng": -74.006,
  "updatedAt": "2026-06-01T14:30:00.000Z",
  "driver": {
    "username": "driver1",
    "phone": "+15559876543",
    "vehicleType": "Bike",
    "vehicleNumber": "ABC-123"
  }
}
```

The `driver` object is included when profile data is available from the location update handler.

### Client event: `driver:location:update`

Drivers may emit this on their socket (same payload shape as REST: `driverId`, `lat`, `lng`, optional `timestamp`). The server re-broadcasts via the same **`driver:location`** logic. Primary path is **`PATCH /api/driver/location`**.

---

## Socket rooms (drivers)

On connect, drivers always join **`driver:<userId>`**.

| Condition | Also joined |
| --------- | ----------- |
| `availabilityStatus === "online"` on connect | `drivers:pool` |
| After `PATCH /availability` → online | `drivers:pool` |
| After `PATCH /availability` → offline | leaves `drivers:pool` |

Pool room receives **`order:update`** for unassigned **`PREPARING`** orders (see [`orders.md`](orders.md)).

---

## Profile (shared routes)

Drivers use the same profile endpoints as other roles (see [`API.md`](API.md)):

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `GET` | `/api/customer` | Returns `DriverProfile` for the logged-in driver |
| `POST` | `/api/customer/complete` | Upsert driver profile (username, phone, vehicle fields) |
| `POST` | `/api/customer/password` | Update password |
| `DELETE` | `/api/customer` | Delete profile and account |

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

## Frontend clients

| Module | Purpose |
| ------ | ------- |
| `frontend/src/api/driver.js` | `updateLocation(lat, lng)` |
| `frontend/src/hooks/useDriverAutoLocation.js` | Auto GPS every 10s + socket emit |

---

## Error shape

Failures typically return JSON:

```json
{ "message": "Human-readable reason" }
```

Status codes: **400** validation, **401** unauthorized, **403** forbidden role, **404** not found, **500** unexpected server error.
