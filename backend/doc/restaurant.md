# Restaurant APIs

These endpoints support **restaurant menu management** and **restaurant status**. They are mounted under `/api` in `server.js`.

## Authentication and role

Every route below requires:

1. **Header:** `Authorization: Bearer <JWT>`
2. **User role:** `restaurant` (enforced by `roleMiddleware(["restaurant"])`)

Requests without a valid token receive **401**. Authenticated users with another role receive **403**.

The authenticated user’s MongoDB `_id` is treated as **`restaurantId`** for menu items and categories, and as **`userId`** when reading or updating `RestaurantProfile` status.

---

## Base URLs (default server)

Assume the API host is `http://localhost:5000` (or your deployed host). Paths are relative to that host.

| Area        | Base path        |
| ----------- | ---------------- |
| Menu        | `/api/menu`      |
| Categories  | `/api/category`  |
| Status      | `/api/restaurant`|

---

## Restaurant status

Backed by the **`RestaurantProfile`** document for the logged-in user (`status`: `open` | `closed` | `busy`).

### `GET /api/restaurant/status`

Returns the current operational status.

**Response (200):**

```json
{ "status": "open" }
```

**Errors:** `404` if no restaurant profile exists for this user.

---

### `PATCH /api/restaurant/status`

Updates operational status.

**Body (JSON):**

```json
{ "status": "closed" }
```

Allowed values: `"open"`, `"closed"`, `"busy"`.

**Response (200):**

```json
{ "status": "closed" }
```

**Errors:** `400` if `status` is missing or invalid; `404` if profile not found.

---

## Categories

Categories belong to the restaurant (`restaurantId` = authenticated user `_id`).

### `POST /api/category/`

Creates a category.

**Body (JSON):**

```json
{ "name": "Mains" }
```

**Response (201):**

```json
{ "category": { "_id": "...", "restaurantId": "...", "name": "Mains", "createdAt": "...", "updatedAt": "..." } }
```

**Errors:** `400` if `name` is missing or empty.

---

### `GET /api/category/`

Lists all categories for this restaurant, oldest first.

**Response (200):**

```json
{ "categories": [ { "_id": "...", "restaurantId": "...", "name": "Mains", ... } ] }
```

---

### `DELETE /api/category/:id`

Deletes a category by MongoDB `_id`.

**Response (200):**

```json
{ "message": "Category deleted" }
```

**Errors:** `404` if the category does not exist or belongs to another restaurant; `400` if any menu item still references this category.

---

## Menu items

Menu items reference **`categoryId`**; the category must belong to the same restaurant.

### `POST /api/menu/`

Creates a menu item.

**Body (JSON):**

| Field          | Type    | Required | Notes                                      |
| -------------- | ------- | -------- | ------------------------------------------ |
| `name`         | string  | yes      | Trimmed                                    |
| `price`        | number  | yes      | Must be a valid number                     |
| `categoryId`   | string  | yes      | Valid ObjectId; must be your category      |
| `description`  | string  | no       | Defaults to `""`                           |
| `imageUrl`     | string  | no       | Optional; empty becomes `null`             |
| `isAvailable`  | boolean | no       | Defaults to `true`                         |

**Response (201):**

```json
{ "item": { "_id": "...", "restaurantId": "...", "name": "...", ... } }
```

**Errors:** `400` for validation (e.g. unknown category for this restaurant).

---

### `GET /api/menu/`

Lists all menu items for this restaurant (newest first).

**Response (200):**

```json
{ "items": [ { "_id": "...", "name": "...", "price": 9.99, "categoryId": "...", ... } ] }
```

---

### `GET /api/menu/:id`

Returns one menu item if it belongs to this restaurant.

**Response (200):**

```json
{ "item": { ... } }
```

**Errors:** `400` invalid id; `404` not found or not owned.

---

### `PATCH /api/menu/:id`

Partial update. Include only fields to change.

**Body (JSON)** — all optional:

| Field           | Type    | Notes                                                |
| --------------- | ------- | ---------------------------------------------------- |
| `name`          | string  | Non-empty after trim                                 |
| `description`   | string  |                                                      |
| `price`         | number  |                                                      |
| `categoryId`    | string  | Must still be a category owned by this restaurant   |
| `imageUrl`      | string  | `null` or empty clears to `null`                     |
| `isAvailable`   | boolean |                                                      |

**Response (200):**

```json
{ "item": { ... } }
```

**Errors:** `400` / `404` as for create and ownership rules.

---

### `DELETE /api/menu/:id`

Deletes a menu item owned by this restaurant.

**Response (200):**

```json
{ "message": "Menu item deleted" }
```

**Errors:** `400` invalid id; `404` not found or not owned.

---

### `POST /api/menu/upload-image`

**Placeholder** image upload (no file storage). Accepts **`multipart/form-data`** with a single file field named **`file`**.

**Response (200):**

```json
{ "url": "https://dummyimage.com/menu-item.jpg" }
```

**Errors:** `400` if no file is present (`{ "message": "File is required" }`).

---

## Error shape

Failures typically return JSON:

```json
{ "message": "Human-readable reason" }
```

Status codes: **400** validation, **401** unauthorized, **403** forbidden role, **404** not found, **500** unexpected server error.

---

## Related data models (summary)

- **`MenuItem`:** `restaurantId` (ref `User`), `name`, `description`, `price`, `categoryId` (ref `Category`), optional `imageUrl`, `isAvailable`, timestamps.
- **`Category`:** `restaurantId` (ref `User`), `name`, timestamps.
- **`RestaurantProfile`:** includes `status` (`open` | `closed` | `busy`); status APIs read/update this document for the authenticated restaurant user.
