# Restaurant APIs

These endpoints support **restaurant menu management**, **restaurant operational status**, and **customer browse** (list restaurants and view a restaurant’s available menu). Mounted at `/api/menu`, `/api/category`, and `/api/restaurant` in `server.js`.

**See also:** [`API.md`](API.md) (auth & profile), [`driver.md`](driver.md) (driver location).

## Authentication and role

Every route below requires **`Authorization: Bearer <JWT>`**.

| Route group | Required role |
| ----------- | ------------- |
| Status, categories, menu CRUD, image upload | `restaurant` |
| `GET /api/restaurant`, `GET /api/restaurant/:id` | `customer` |
| `GET /api/menu/restaurant/:restaurantId` | `customer` |

Requests without a valid token receive **401**. Authenticated users with the wrong role receive **403**.

For **restaurant** routes, the authenticated user’s MongoDB `_id` is **`restaurantId`** on menu items and categories, and **`userId`** on `RestaurantProfile` status. For **customer** browse routes, `:id` / `:restaurantId` is the restaurant user’s `_id` (same value stored on `MenuItem.restaurantId`).

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

## Customer browse (restaurants)

Requires JWT with role **`customer`**.

### `GET /api/restaurant`

Lists all restaurants that have a **`RestaurantProfile`**, sorted by `restaurantName` ascending.

**Response (200):**

```json
{
  "restaurants": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Pizza Place",
      "location": "123 Food Court",
      "cuisine": null,
      "rating": 0,
      "image": null,
      "status": "open"
    }
  ]
}
```

| Field | Notes |
| ----- | ----- |
| `id` | Restaurant **`User`** `_id` (use as `restaurantId` when ordering or loading menu) |
| `name` | `restaurantName` from profile |
| `cuisine` | `cuisineType` or `null` |
| `rating` | `ratingAverage` (default `0`) |
| `image` | `image` or `imageUrl` on profile if present, else `null` |
| `status` | `open` \| `closed` \| `busy` (default `open`) |

---

### `GET /api/restaurant/:id`

Returns one restaurant in the same shape as a list element.

**Response (200):**

```json
{
  "restaurant": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Pizza Place",
    "location": "123 Food Court",
    "cuisine": null,
    "rating": 0,
    "image": null,
    "status": "open"
  }
}
```

**Errors:** `400` invalid ObjectId; `404` no profile for that `userId`.

---

## Categories

Categories belong to the restaurant (`restaurantId` = authenticated user `_id`).

### `POST /api/category/`

Creates a category. Duplicate names (case-insensitive, same restaurant) return **409**.

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

### `GET /api/menu/restaurant/:restaurantId` (customer)

Returns **available** menu items for the given restaurant (`isAvailable: true`), newest first. Requires role **`customer`**.

**Response (200):**

```json
{
  "items": [
    {
      "itemId": "507f1f77bcf86cd799439012",
      "name": "Margherita",
      "description": "Tomato, mozzarella, basil",
      "price": 12.99,
      "image": "https://res.cloudinary.com/.../image.jpg",
      "category": "Mains"
    }
  ]
}
```

| Field | Notes |
| ----- | ----- |
| `itemId` | Menu item `_id` (use as `menuItemId` when creating an order) |
| `image` | `imageUrl` or `null` |
| `category` | Populated category **name**, or `null` |

**Errors:** `400` invalid `restaurantId`.

This shape is optimized for the customer UI; restaurant owners use the full `MenuItem` document from `GET /api/menu/` below.

---

### `POST /api/menu/` (restaurant)

Creates a menu item.

**Body (JSON):**

| Field          | Type    | Required | Notes                                      |
| -------------- | ------- | -------- | ------------------------------------------ |
| `name`         | string  | yes      | Trimmed                                    |
| `price`        | number  | yes      | Must be a valid number ≥ 0                 |
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

### `GET /api/menu/` (restaurant)

Lists all menu items for the logged-in restaurant (newest first). Each item’s `categoryId` is **populated** with `{ _id, name }` for display.

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

Uploads an image to **Cloudinary** (server-side). Requires env vars: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

Accepts **`multipart/form-data`** with a single file field named **`file`**.

**Response (200):**

```json
{ "url": "https://res.cloudinary.com/.../image.jpg" }
```

The value is Cloudinary’s **`secure_url`** (exposed as `url` for the frontend).

**Errors:**

- `400` if no file (`{ "message": "File is required" }`)
- `503` if Cloudinary is not configured (`"Image upload is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."`)
- `500` if the upload fails

Uploaded images are stored under Cloudinary folder **`food-delivery/menu`**.

---

## Frontend clients

| Module | Role | Endpoints |
| ------ | ---- | --------- |
| `frontend/src/api/restaurant.js` | restaurant / customer | `getStatus`, `updateStatus`, `getAllRestaurants`, `getRestaurant` |
| `frontend/src/api/menu.js` | restaurant / customer | `getMenuItems`, `getMenuByRestaurant`, CRUD, `uploadMenuImage` |
| `frontend/src/api/category.js` | restaurant | category CRUD |

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
