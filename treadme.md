# Try & Buy Shopify Backend

## Quick Start & Project Info

- **Database:** This project uses SQLite. The database file (`trybuy.db`) is automatically created in the project root when you start the backend—no manual setup required.
- **Node.js Version:** 20.9.0 (recommended)

### Backend Setup
1. Open a terminal and navigate to the `fashionshop` folder.
2. Run:
   ```bash
   npm install
   ```
   This installs all backend dependencies.
3. To start the backend server, run:
   ```bash
   npm start
   ```
   Or use Visual Studio Code's Run/Debug feature.
   - The backend will run on port **3000** by default.
   - On first start, it will automatically generate `trybuy.db` in the root folder.
4. To add dummy data to the database, run:
   ```bash
   node seed.js
   ```

### Frontend Setup & Run
1. Open a terminal and navigate to the `frontend` folder.
2. Run:
   ```bash
   npm install
   ```
   This installs all frontend dependencies.
3. To start the frontend development server, run:
   ```bash
   npm run dev
   ```
   - The console will display a local URL (e.g., `http://localhost:5173`). Copy and open it in your browser.
   - You will see two products. You can add them to the cart and select the "Try & Buy" checkbox to let the system automatically add suitable suggestions.

---

## Overview

This backend implements a **Try & Buy workflow** for Shopify fashion orders.  
It handles:

- Detecting Try & Buy orders from Shopify webhooks
- Generating additional internal items (sizes + recommended items)
- Allowing Ops to mark orders as packed, add/remove sizes, and recommend similar items
- Rider APIs to mark kept and returned items
- Inventory management: reserve, deduct, release

> **Tech stack:** Node.js, Express, Sequelize, SQLite, Shopify Admin API

---

## Folder Structure

```
try-buy-backend/
├─ src/
│   ├─ controllers/       # Order & Rider controllers
│   ├─ services/          # Business logic (TryBuy + Inventory)
│   ├─ shopify/           # Shopify API wrapper
│   ├─ models/            # Sequelize models + DB
│   ├─ routes/            # Express routes
│   └─ app.js             # Express entry point
├─ .env                   # API keys and config
├─ package.json
└─ trybuy.db              # SQLite DB (auto-created)
```

---

## Setup

1. Clone the repo:
```bash
git clone <repo-url>
cd try-buy-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:

```env
PORT=3000
SHOPIFY_API_URL=https://your-store-name.myshopify.com/admin/api/2024-01
SHOPIFY_API_TOKEN=shpat_xxxxxxxxxxxxxx
```

4. Run server (dev mode):
```bash
npm run dev
```

> Server will auto-create `trybuy.db` SQLite database.

---

## Database

### Tables

- **Orders**
  ```
id | shopify_order_id | customer_id | status
```

- **OrderItems**
  ```
id | order_id | variant_id | size | price | status | reserved | recommended
```

### Notes

- `status` values: `SENT`, `KEPT`, `RETURNED`
- `reserved` = true when order is packed
- `recommended` = true for system-generated similar items

---

## APIs

### 1. Shopify Webhook

**POST /api/orders/webhook**

- Creates Try & Buy order internally
- Adds additional sizes and recommended items
- Tags Shopify order with `TRY_AND_BUY`

**Payload Example:**

```json
{
  "customer": {
    "id": 1
  },
  "products": [
    {
      "id": 1,
      "variant_id": 1,
      "try_and_buy": true
    }
  ]
}
```

---

### 2. Ops APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/orders/:orderId/packed` | POST | Mark order as packed and reserve inventory |
| `/api/orders/:orderId/items` | POST | Add size or recommended item |
| `/api/orders/items/:itemId` | DELETE | Remove item from order |
| `/api/storeops/orders` | GET | Get all Try & Buy orders for StoreOps UI |
| `/api/products` | GET | Get all products (for suggestions) |
| `/api/products/:id` | GET | Get product details |
| `/api/orders/:orderId` | GET | Get order details (admin) |

**Add Item Payload Example:**

```json
{
  "variant_id": 115,
  "size": "M",
  "recommended": true
}
```

---

### 3. Rider APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/rider/orders/random` | GET | Get a random order for rider |
| `/api/rider/orders/:orderId` | GET | Get all items for rider |
| `/api/rider/orders/:orderId/complete` | POST | Mark items as kept or returned |

**Complete Payload Example:**

```json
{
  "kept": [1,3],
  "returned": [2,4],
  "paidAmount": 5997
}
```

---

## Inventory Logic

| Stage | Action |
|-------|--------|
| Order created | ❌ Do not deduct |
| Order packed | ✅ Reserve inventory (`reserved = true`) |
| Rider completes | ✅ Deduct kept, release returned |

---

## Testing Locally

1. Use **Postman** or `curl` to hit webhook:
```bash
POST http://localhost:3000/api/orders/webhook
```

2. Mark order packed:
```bash
POST http://localhost:3000/api/orders/1/packed
```

3. Rider views items:
```bash
GET http://localhost:3000/api/rider/orders/1
```

4. Rider completes Try & Buy:
```bash
POST http://localhost:3000/api/rider/orders/1/complete
```

5. Get random order for rider:
```bash
GET http://localhost:3000/api/rider/orders/random
```

6. Mark item as kept & paid:
```bash
POST http://localhost:3000/api/rider/orders/1/items/1/kept-paid
```

7. Mark item as returned:
```bash
POST http://localhost:3000/api/rider/orders/1/items/2/returned
```

8. Verify database in **SQLite Browser** (`trybuy.db`)

---

## Notes & Design Decisions

- Shopify Admin UI filters orders using `TRY_AND_BUY` tag.
- Ops APIs allow adding/removing sizes and recommended items.
- Inventory is **never deducted before rider confirmation**.
- `recommended` items are generated by a simple backend algorithm.
- Webhook HMAC verification can be added for production security.

