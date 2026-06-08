# Order APIs — lifecycle (REST + Socket.io)

Order status flow:

`PLACED` → `ACCEPTED` → `PREPARING` → `PICKED_UP` → `DELIVERED`

Any non-`DELIVERED` state may move to **`CANCELLED`** per role rules below.

Mounted at **`/api/orders`** in `server.js`. All routes require **`Authorization: Bearer <JWT>`**. Status changes and new orders emit **`order:update`** over Socket.io (see [Real-time updates](#real-time-updates-socketio)).

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
{ "order": { "_id": "...", "status": "PLACED", "totalAmount": 19.98, "items": [...], ... } }
```

---

## List orders

| Method | Path | Response |
| ------ | ---- | -------- |
| `GET` | `/api/orders/customer` | `{ "orders": [...] }` |
| `GET` | `/api/orders/restaurant` | `{ "orders": [...] }` |
| `GET` | `/api/orders/driver` | `{ "orders": [...] }` — orders where `driverId` is this driver **or** `status === "PREPARING"` and `driverId` is null (pool) |

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
| `driver` | `driver:<userId>`, `drivers:pool` |

### Event: `order:update`

Emitted on **create** and **status change** to:

- `customer:<customerId>`
- `restaurant:<restaurantId>`
- `driver:<driverId>` when assigned
- `drivers:pool` when `status === "PREPARING"` and no `driverId` yet

**Payload:**

```json
{
  "orderId": "507f1f77bcf86cd799439011",
  "status": "PREPARING",
  "updatedAt": "2026-06-01T14:30:00.000Z"
}
```

Client helper: `frontend/src/socket.js`.
