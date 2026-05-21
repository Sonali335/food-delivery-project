# Order APIs — lifecycle (REST)

Order status flow (no WebSockets in this phase):

`PLACED` → `ACCEPTED` → `PREPARING` → `PICKED_UP` → `DELIVERED`

Any non-`DELIVERED` state may move to `CANCELLED` per role rules below.

Mounted at **`/api/orders`** in `server.js`. All routes require **`Authorization: Bearer <JWT>`**.

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

`name` and `price` are snapshotted from the menu item at order time.

**Response (201):**

```json
{ "order": { "_id": "...", "status": "PLACED", "totalAmount": 19.98, "items": [...], ... } }
```

---

## List orders

| Method | Path | Response |
| ------ | ---- | -------- |
| `GET` | `/api/orders/customer` | `{ "orders": [...] }` |
| `GET` | `/api/orders/restaurant` | `{ "orders": [...] }` |
| `GET` | `/api/orders/driver` | `{ "orders": [...] }` (assigned `driverId` only) |

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
| `PREPARING` | `PICKED_UP` | driver (sets `driverId` to logged-in driver) |
| `PREPARING` | `CANCELLED` | restaurant |
| `PICKED_UP` | `DELIVERED` | driver (must be assigned driver) |

Invalid transitions return **400** with a clear `message`. Wrong role returns **403**.

**Response (200):**

```json
{ "order": { ... } }
```

---

## Order model (summary)

- `customerId`, `restaurantId` (ref `User`)
- `driverId` (ref `User`, optional until pickup)
- `items[]`: `{ menuItemId, name, quantity, price }`
- `totalAmount`
- `status`: enum listed above
- `createdAt`, `updatedAt`

---

## Frontend client

`frontend/src/api/orders.js` — `createOrder`, `getOrder`, `getCustomerOrders`, `getRestaurantOrders`, `getDriverOrders`, `updateOrderStatus`.

---

## Next phase (not implemented yet)

Emit Socket.io events from `updateOrderStatus` when real-time updates are added.
