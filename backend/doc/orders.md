# Order APIs — lifecycle (REST + Socket.io)

Order status flow:

`PLACED` → `ACCEPTED` → `PREPARING` → `PICKED_UP` → `DELIVERED`

Any non-`DELIVERED` state may move to **`CANCELLED`** per role rules below.

Mounted at **`/api/orders`** in `server.js`. All routes require **`Authorization: Bearer <JWT>`**. Status changes and field updates emit **`order:update`** over Socket.io (see [Real-time updates](#real-time-updates-socketio)).

---

## Authentication and roles

| Endpoint | Role |
| -------- | ---- |
| `POST /api/orders` | `customer` |
| `GET /api/orders/customer` | `customer` |
| `GET /api/orders/restaurant` | `restaurant` |
| `GET /api/orders/driver` | `driver` |
| `GET /api/orders/:id` | customer, restaurant, or driver related to the order |
| `PATCH /api/orders/:id/status` | depends on transition (see below) |
| `PATCH /api/orders/:id` | `restaurant` |

---

## Create order

### `POST /api/orders`

**Body (JSON):**

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `restaurantId` | string | yes | Restaurant user `_id` (same as menu `restaurantId`) |
| `items` | array | yes | At least one line item |
| `items[].menuItemId` | string | yes | Must belong to that restaurant |
| `items[].quantity` | number | yes | Positive integer |

At order time the server snapshots from each menu item:

- `name`, `price`, **`prepTime`** (minutes; allowed values 10, 15, 20, 25, 30, 35, 40; default 20)

**Validation (non-exhaustive):**

| Check | Typical status | Example `message` |
| ----- | -------------- | ----------------- |
| Missing `restaurantId` or empty `items` | **400** | `"restaurantId is required"` / `"items must be a non-empty array"` |
| Invalid ObjectIds | **400** | `"Invalid restaurantId"` / `"Invalid menuItemId"` |
| Restaurant has no profile | **404** | `"Restaurant not found"` |
| Menu item not for that restaurant | **400** | `"Menu item not found for this restaurant"` |
| Menu item `isAvailable === false` | **400** | `"Menu item \"…\" is not available"` |
| Invalid quantity (non-integer or < 1) | **400** | `"Each item requires a positive integer quantity"` |

On success, the server emits **`order:update`** to the customer and restaurant rooms.

**Response (201):**

```json
{
  "order": {
    "_id": "...",
    "status": "PLACED",
    "totalAmount": 19.98,
    "items": [
      {
        "menuItemId": "...",
        "name": "Margherita",
        "quantity": 2,
        "price": 9.99,
        "prepTime": 20
      }
    ],
    "eta": null,
    "prepTimeMinutes": null,
    "...": "..."
  }
}
```

---

## List orders

| Method | Path | Response |
| ------ | ---- | -------- |
| `GET` | `/api/orders/customer` | `{ "orders": [...] }` — newest first |
| `GET` | `/api/orders/restaurant` | `{ "orders": [...] }` — newest first |
| `GET` | `/api/orders/driver` | `{ "orders": [...] }` — see [Driver list rules](#driver-list-rules) |

### Driver list rules

Behavior depends on **`DriverProfile.availabilityStatus`** (see [`driver.md`](driver.md)):

| Status | Query |
| ------ | ----- |
| **`online`** | Orders where `driverId` is this driver **OR** (`status === "PREPARING"` and `driverId` is null) |
| **`offline`** | Orders where `driverId` is this driver **only** (no pool orders) |

---

## Get one order

### `GET /api/orders/:id`

Returns `{ "order": { ... } }` if the caller is the customer, restaurant, or an assigned driver (drivers may also read `PREPARING` orders not yet assigned).

---

## Update status

### `PATCH /api/orders/:id/status`

**Body (JSON):**

```json
{ "status": "ACCEPTED" }
```

### Allowed transitions

| From | To | Role |
| ---- | -- | ---- |
| `PLACED` | `ACCEPTED` | restaurant |
| `PLACED` | `CANCELLED` | customer, restaurant |
| `ACCEPTED` | `PREPARING` | restaurant |
| `ACCEPTED` | `CANCELLED` | customer, restaurant |
| `PREPARING` | `PICKED_UP` | driver (sets `driverId`) or restaurant |
| `PREPARING` | `CANCELLED` | restaurant |
| `PICKED_UP` | `DELIVERED` | driver (must be assigned driver) or restaurant |

Invalid transitions return **400** with a clear `message`. Wrong role returns **403**.

On success, emits **`order:update`** (see below).

**Response (200):**

```json
{ "order": { ... } }
```

---

## Update order fields (restaurant)

### `PATCH /api/orders/:id`

Restaurant-only endpoint for fields other than status. Used when accepting orders to set ETA and prep time.

**Body (JSON)** — include only fields to change:

| Field | Type | Notes |
| ----- | ---- | ----- |
| `eta` | string (ISO date) or `null` | Estimated delivery / ready time |
| `prepTimeMinutes` | number or `null` | Allowed: 10, 15, 20, 25, 30, 35, 40 |

**Example**

```json
{
  "eta": "2026-06-01T15:00:00.000Z",
  "prepTimeMinutes": 25
}
```

**Response (200):**

```json
{ "order": { ... } }
```

Emits **`order:update`** with `eta` and `prepTimeMinutes` in the payload.

**Errors:** **403** if caller is not the order’s restaurant; **400** for invalid `eta` or `prepTimeMinutes`.

---

## Order model (summary)

- `customerId`, `restaurantId` (ref `User`)
- `driverId` (ref `User`, optional until pickup)
- `items[]`: `{ menuItemId, name, quantity, price, prepTime }`
- `totalAmount`
- `status`: enum listed above
- `eta` (Date, optional) — set by restaurant on accept
- `prepTimeMinutes` (number, optional) — max prep time used for ETA
- `createdAt`, `updatedAt`

---

## Prep time and ETA (application logic)

- Each **menu item** stores `prepTime` (see [`restaurant.md`](restaurant.md)).
- Line items copy `prepTime` at order creation.
- On accept, the restaurant client typically sets:
  - `prepTimeMinutes` = max of line item prep times (fallback: restaurant settings average)
  - `eta` = now + `prepTimeMinutes`

This is enforced in the frontend accept flow; the API stores whatever valid values the restaurant sends via **`PATCH /api/orders/:id`**.

---

## Frontend client

`frontend/src/api/orders.js` — `createOrder`, `getOrder`, `getCustomerOrders`, `getRestaurantOrders`, `getDriverOrders`, `updateOrderStatus`, `updateOrder`.

---

## Real-time updates (Socket.io)

Socket.io runs on the **same host and port** as the REST API (`backend/socket/index.js`).

### Connection and auth

Pass the same JWT used for REST:

| Method | Example |
| ------ | ------- |
| Query | `?token=<JWT>` |
| Handshake auth | `{ auth: { token: "<JWT>" } }` |
| Header | `Authorization: Bearer <JWT>` |

Invalid or missing token rejects the connection.

### Rooms (joined on connect)

| Role | Room(s) |
| ---- | ------- |
| `customer` | `customer:<userId>` |
| `restaurant` | `restaurant:<userId>` |
| `driver` | `driver:<userId>`; `drivers:pool` only when **online** |

### Event: `order:update`

Emitted on **create**, **status change**, and **restaurant field patch** (`eta`, `prepTimeMinutes`) to:

- `customer:<customerId>`
- `restaurant:<restaurantId>`
- `driver:<driverId>` when assigned
- `drivers:pool` when `status === "PREPARING"` and no `driverId` yet (online drivers only receive if in pool room)

**Payload:**

```json
{
  "orderId": "507f1f77bcf86cd799439011",
  "status": "PREPARING",
  "updatedAt": "2026-06-01T14:30:00.000Z",
  "eta": "2026-06-01T15:00:00.000Z",
  "prepTimeMinutes": 25
}
```

`eta` and `prepTimeMinutes` may be `null` if not set.

### Related: `driver:location`

When a driver updates GPS, restaurants receive live location for assigned orders. See [`driver.md`](driver.md#real-time-driver-location).

Client helper: `frontend/src/socket.js`.
