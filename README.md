# ⛏️ Mining Inventory & Supply Chain Management API

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-blue.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-indigo.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![OpenAPI / Swagger](https://img.shields.io/badge/Swagger-OpenAPI%203.0-brightgreen.svg)](http://localhost:3000/api-docs)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A high-performance, production-grade RESTful backend engineered for heavy equipment mining operations. Built with an **N-Tier layered architecture**, the system automates procurement lifecycles, calculates financial Input Tax Credits (GST/ITC), guarantees inventory stock integrity through ACID-compliant transactional workflows, and enforces role-based access control (RBAC).

---

## 📑 Table of Contents
- [Architecture & Design](#-architecture--design)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Database Schema & ERD](#-database-schema--erd)
- [Cloud Database Setup (Neon / Supabase)](#-cloud-database-setup-neon--supabase)
- [Deployment Guide (Render / Railway / Docker)](#-deployment-guide-render--railway--docker)
- [Environment Variables](#-environment-variables)
- [Local Setup & Development](#-local-setup--development)
- [API Documentation & Swagger UI](#-api-documentation--swagger-ui)
- [Testing & Quality Assurance](#-testing--quality-assurance)

---

## 🏛️ Architecture & Design

The application follows an **N-Tier Layered Monolithic Architecture** ensuring strict separation of concerns, maintainability, and scalability:

```
src/
├── config/             # Database (Prisma), Logger (Winston), and Swagger configs
├── controllers/        # Request handling & HTTP response orchestration
├── middleware/         # Auth (JWT/RBAC), Validation (Zod), Logging (Morgan), Security (Helmet/CORS), Global Error Handler
├── routes/             # RESTful API routing declarations
├── services/           # Domain business logic, financial arithmetic & atomic transactions
├── utils/              # Custom AppError and helper utilities
├── validators/         # Zod schemas for request validation
├── app.js              # Express app configuration, security middleware, and route mounting
└── server.js           # Server bootstrap, DB connection verification & graceful shutdown handlers
```

---

## ⚡ Key Features

1. **Role-Based Access Control (RBAC)**:
   - Granular authentication with JWT (`ADMIN` vs. `ENGINEER`).
   - Route-level middleware locks write operations and financial analytics to administrative accounts.

2. **ACID Transactional Stock Integrity**:
   - **Procurement (Purchase Orders)**: Atomically logs supplier orders, computes exact GST & Input Tax Credit (ITC), and increments physical stock.
   - **Site Requisitions**: Uses interactive Prisma database transactions (`$transaction`) with optimistic concurrency checks (`current_stock >= requested_qty`) to prevent negative inventory and race conditions.

3. **Domain Financial Calculations**:
   - Automated multi-rate GST computation ($Subtotal = Qty \times BasePrice$, $ITC = Subtotal \times GSTRate$, $Total = Subtotal + ITC$).
   - Monthly spend aggregations and tax input analytics.

4. **Production Security & Hardening**:
   - HTTP response header protection via **Helmet**.
   - Dynamic **CORS** origin resolution with pre-flight handling.
   - Strict request payload validation via **Zod schemas**.
   - Centralized global error handling with production stack sanitization.

5. **Observability & Documentation**:
   - Structured JSON logging with **Winston** (console + rotated log files) and HTTP tracing with **Morgan**.
   - Interactive **OpenAPI 3.0 (Swagger UI)** dashboard served at `/api-docs`.

---

## 🛠️ Technology Stack

| Component | Technology | Version / Details |
| :--- | :--- | :--- |
| **Runtime** | Node.js | v20 LTS / v24 |
| **Framework** | Express.js | 5.2.x |
| **ORM** | Prisma ORM | 5.22.x |
| **Database** | PostgreSQL | 15 / 16 (Local / Neon / Supabase / Render) |
| **Authentication** | JSON Web Tokens & Bcrypt | JWT (`jsonwebtoken` 9.x), `bcrypt` 6.x |
| **Validation** | Zod | 4.x |
| **Security** | Helmet & CORS | `helmet` 8.x, `cors` 2.8.x |
| **Documentation** | Swagger / OpenAPI 3.0 | `swagger-ui-express`, `swagger-jsdoc` |
| **Logging** | Winston & Morgan | `winston` 3.x, `morgan` 1.x |

---

## 🗄️ Database Schema & ERD

```
+----------------+       +-------------------+       +-----------------------+
|      User      |       |     Supplier      |       |     InventoryItem     |
+----------------+       +-------------------+       +-----------------------+
| id (UUID, PK)  |       | id (UUID, PK)     |       | id (UUID, PK)         |
| name (String)  |       | name (String)     |       | name (String)         |
| email (Unique) |       | gst_number(Unique)|<------| category (String)     |
| password_hash  |       | contact_info      |   1:N | stock_qty (Int)       |
| role (Enum)    |       | created_at        |       | min_stock_threshold   |
+--------+-------+       +---------+---------+       | unit_price (Float)    |
         |                         |                 | gst_rate (Float)      |
         | 1:N                     | 1:N             | supplier_id (FK)      |
         v                         v                 +-------+-------+-------+
+----------------+       +-------------------+               |       ^
|  Requisition   |       |   PurchaseOrder   |               |       | 1:N
+----------------+       +-------------------+               |       |
| id (UUID, PK)  |       | id (UUID, PK)     |               |       |
| qty_requested  |       | qty (Int)         |               |       |
| status (Enum)  |       | base_price (Float)|               |       |
| user_id (FK)   |       | subtotal (Float)  |               |       |
| item_id (FK)---+------>| itc_amount (Float)|               |       |
+----------------+  N:1  | total_amount      |               |       |
                         | supplier_id (FK)  |               |       |
                         | item_id (FK)------+---------------+-------+
                         +-------------------+  N:1
```

---

## ☁️ Cloud Database Setup (Neon / Supabase)

### Option A: Neon.tech (Recommended)
1. Navigate to [Neon.tech](https://neon.tech/) and create a free PostgreSQL project.
2. Under **Connection Details**, copy your pooled connection string:
   ```env
   DATABASE_URL="postgresql://[user]:[password]@[neon-hostname]/[database]?sslmode=require"
   ```
3. Deploy migrations to the cloud instance:
   ```bash
   npx prisma migrate deploy
   ```

### Option B: Supabase
1. Create a project on [Supabase.com](https://supabase.com/).
2. In **Project Settings -> Database**, copy the **URI** connection string (Session/Direct pooler on port 5432 or Transaction pooler on 6543).
3. Set `DATABASE_URL` in your environment and deploy schema:
   ```bash
   npx prisma migrate deploy
   ```

---

## 🚀 Deployment Guide (Render / Railway / Docker)

### Deploy to Render
1. Push your repository to GitHub.
2. Sign in to [Render.com](https://render.com/) and click **New -> Blueprint**.
3. Select your `Mine_Inventory` repository (`render.yaml` will be auto-detected).
4. Configure environment variables in the Render dashboard (`DATABASE_URL`, `JWT_SECRET`).
5. Render will automatically execute the build pipeline:
   - `npm install`
   - `npx prisma generate`
   - `npx prisma migrate deploy`
   - `npm start`

### Deploy to Railway
1. Sign in to [Railway.app](https://railway.app/) and select **Deploy from GitHub repo**.
2. Railway detects [`railway.json`](railway.json) and installs all dependencies and Prisma engines automatically via Nixpacks.
3. Add your `DATABASE_URL` and `JWT_SECRET` in the **Variables** tab.

### Deploy with Docker
Build and run the container locally or on any cloud VPS / Kubernetes cluster:
```bash
# 1. Build the Docker image
docker build -t mining-inventory-api .

# 2. Run the container
docker run -d -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/mining_inventory_db" \
  -e JWT_SECRET="your_production_secret" \
  -e NODE_ENV="production" \
  --name mining-api mining-inventory-api
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory by copying [`.env.example`](.env.example):

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `NODE_ENV` | Application runtime environment | `development` / `production` |
| `PORT` | HTTP Server Port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret key for signing Auth tokens | `super_secret_jwt_key_123` |
| `JWT_EXPIRES_IN` | Token validity window | `1d` |
| `CORS_ORIGIN` | Allowed cross-origin domains | `*` or `https://my-app.vercel.app` |
| `LOG_LEVEL` | Minimum severity level for Winston logger | `info` / `debug` |

---

## 💻 Local Setup & Development

```bash
# 1. Clone the repository
git clone https://github.com/ZeeshaAzhar01/Mine_Inventory.git
cd Mine_Inventory

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env

# 4. Run database migrations
npx prisma migrate dev

# 5. Start the development server (with hot reload)
npm run dev
```

The API will start at `http://localhost:3000`.

---

## 📖 API Documentation & Swagger UI

Once the server is running, explore and test all endpoints interactively through Swagger UI:

- **Interactive UI**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **Raw OpenAPI JSON**: [http://localhost:3000/api-docs.json](http://localhost:3000/api-docs.json)
- **System Health Check**: [http://localhost:3000/api/health](http://localhost:3000/api/health)

### Available Modules
- **`/api/auth`**: User registration & login with JWT generation.
- **`/api/users`**: User management & role authorization verification.
- **`/api/suppliers`**: Supplier onboarding, GST validation, and directory management.
- **`/api/items`**: Inventory catalog, search, pagination, and low-stock alerts.
- **`/api/purchase-orders`**: Procurement tracking, stock replenishment, and automatic GST/ITC calculations.
- **`/api/requisitions`**: Site engineer requests, approval workflows, and atomic stock deductions.
- **`/api/reports`**: Management analytics, monthly spend aggregations, and tax audit summaries.

---

## 🧪 Testing & Quality Assurance

Run the comprehensive End-to-End integration test suite:

```bash
npm test
```

The test suite validates:
- System Health & OpenAPI schema validity
- JWT Authentication & RBAC restrictions
- Supplier uniqueness & GST format enforcement
- Inventory creation, low-stock threshold alerting, search & pagination
- Procurement stock replenishment & financial ITC arithmetic
- Interactive transactions for requisition approval & stock deduction
- Concurrency race conditions & insufficient stock rollback
- Monthly spend aggregations & reporting analytics
