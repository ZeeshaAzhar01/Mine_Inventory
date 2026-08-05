# ⛏️ Heavy Equipment Mining Inventory & Supply Chain API

[![CI Pipeline](https://github.com/ZeeshaAzhar01/Mine_Inventory/actions/workflows/ci.yml/badge.svg)](https://github.com/ZeeshaAzhar01/Mine_Inventory/actions)
[![Node.js](https://img.shields.io/badge/Node.js-20.x%20LTS-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Swagger Docs](https://img.shields.io/badge/Swagger-OpenAPI%203.0-85EA2D?logo=swagger&logoColor=black)](http://localhost:3000/api-docs)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An enterprise-grade, high-concurrency RESTful backend engineered for heavy equipment mining operations and spare parts supply chain management. Built with an **N-Tier Layered Architecture**, the system automates multi-tier procurement workflows, computes GST & Input Tax Credit (ITC) financial arithmetic, enforces role-based access control (RBAC), and guarantees stock integrity through ACID-compliant transactional workflows.

---

## 🎯 Executive Summary & Problem Statement

In industrial mining operations, equipment downtime (e.g., excavators, haul trucks, drills) costs thousands of dollars per hour. Traditional inventory systems suffer from:
- **Race conditions & phantom stock deductions** during concurrent site requisitions.
- **Financial inaccuracies** in complex multi-rate GST and Input Tax Credit (ITC) tracking.
- **Security vulnerabilities** from unvalidated inputs and weak role separation between field engineers and procurement administrators.

This project delivers a **bulletproof, audit-ready backend engine** that solves these challenges using interactive PostgreSQL transactions, strict Zod schema validation, and stateless JWT authorization.

---

## 🏛️ System Architecture & Engineering Design

The system implements a decoupled **N-Tier Layered Architecture**, enforcing separation of concerns between HTTP transport, business domain logic, and data persistence:

```
                          ┌──────────────────────────┐
                          │   HTTP Client / Client   │
                          └─────────────┬────────────┘
                                        │
                         ┌──────────────▼──────────────┐
                         │   Global Middleware Stack   │
                         │  (Helmet, CORS, Winston)    │
                         └──────────────┬──────────────┘
                                        │
                         ┌──────────────▼──────────────┐
                         │     Routing Layer (Routes)  │
                         └──────────────┬──────────────┘
                                        │
                         ┌──────────────▼──────────────┐
                         │   Zod Schema Validation &   │
                         │    JWT / RBAC Middleware    │
                         └──────────────┬──────────────┘
                                        │
                         ┌──────────────▼──────────────┐
                         │  Controllers (Transport)    │
                         └──────────────┬──────────────┘
                                        │
                         ┌──────────────▼──────────────┐
                         │  Domain Services (Business  │
                         │   Logic & Financial Calc)   │
                         └──────────────┬──────────────┘
                                        │
                         ┌──────────────▼──────────────┐
                         │  Data Layer (Prisma ORM &   │
                         │   Interactive Transactions) │
                         └──────────────┬──────────────┘
                                        │
                         ┌──────────────▼──────────────┐
                         │      PostgreSQL Database    │
                         └─────────────────────────────┘
```

---

## 💡 Core Engineering Highlights

### 1. Concurrency-Safe Stock Deductions (`$transaction`)
Field engineer requisitions mutate physical stock. To prevent negative balances under concurrent approvals, the system executes an **interactive Prisma transaction**:
1. Checks current stock inside the transaction boundary.
2. Validates `current_stock >= requested_qty` and ensures requisition is in `PENDING` state.
3. Simultaneously transitions requisition state to `APPROVED` and decrements stock quantity atomically.
4. If conditions fail, rolls back entirely, ensuring zero phantom deductions.

### 2. Multi-Rate GST & Input Tax Credit (ITC) Engine
Procurement calculations strictly follow Indian GST tax compliance laws:
$$\text{Subtotal} = \text{Quantity} \times \text{Base Price}$$
$$\text{ITC Amount} = \text{Subtotal} \times \left(\frac{\text{GST Rate}}{100}\right)$$
$$\text{Total Amount} = \text{Subtotal} + \text{ITC Amount}$$

### 3. Layered Defense Security & Production Hardening
- **Stateless RBAC**: Role verification (`ADMIN` vs. `ENGINEER`) via cryptographically signed JWT tokens.
- **Zod Schema Validation**: Intercepts and sanitizes all incoming `body`, `query`, and `params` before hitting controller handlers.
- **HTTP Security Headers**: Powered by `helmet` with custom Content Security Policies for Swagger UI.
- **Centralized Error Classification**: Custom `AppError` architecture distinguishing operational vs. programmer errors with stack trace sanitization in production.

---

## 🗄️ Database Schema & Entity Relationships

```
+-----------------------------------------------------------------------------------+
|                                 DATABASE ERD                                      |
+-----------------------------------------------------------------------------------+

   +-----------------------+              +-----------------------+
   |         User          |              |       Supplier        |
   +-----------------------+              +-----------------------+
   | id: UUID (PK)         |              | id: UUID (PK)         |
   | name: String          |              | name: String          |
   | email: String (UQ)    |              | gst_number: Str (UQ)  |
   | password_hash: String |              | contact_info: String  |
   | role: Role (ADMIN/ENG)|              | created_at: DateTime  |
   +-----------+-----------+              +-----------+-----------+
               |                                      |
               | 1:N                                  | 1:N
               v                                      v
   +-----------------------+              +-----------------------+
   |      Requisition      |              |     PurchaseOrder     |
   +-----------------------+              +-----------------------+
   | id: UUID (PK)         |              | id: UUID (PK)         |
   | qty_requested: Int    |              | qty: Int              |
   | status: Enum (PENDING)|              | base_price: Float     |
   | user_id: UUID (FK)    |              | subtotal: Float       |
   | item_id: UUID (FK)----+----+         | itc_amount: Float     |
   +-----------------------+    |         | total_amount: Float   |
                                |         | supplier_id: UUID(FK) |
                                |         | item_id: UUID (FK)----+----+
                                |         +-----------------------+    |
                                |                                      |
                                +--------------+  +--------------------+
                                               |  |
                                               v  v
                                    +-----------------------+
                                    |     InventoryItem     |
                                    +-----------------------+
                                    | id: UUID (PK)         |
                                    | name: String          |
                                    | category: String      |
                                    | stock_qty: Int        |
                                    | min_stock_threshold:10|
                                    | unit_price: Float     |
                                    | gst_rate: Float       |
                                    | supplier_id: UUID(FK) |
                                    +-----------------------+
```

---

## 📋 REST API Endpoints

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user account with hashed password |
| `POST` | `/api/auth/login` | Public | Authenticate user and receive signed JWT |
| `GET` | `/api/users/profile` | Auth | Retrieve authenticated user profile |
| `POST` | `/api/users/admin-only` | Admin | Route verifying administrative RBAC privilege |
| `GET` | `/api/suppliers` | Auth | List all registered suppliers |
| `POST` | `/api/suppliers` | Admin | Register supplier with unique GST validation |
| `GET` | `/api/items` | Auth | Search & paginate inventory catalog |
| `POST` | `/api/items` | Admin | Create new inventory item with stock thresholds |
| `GET` | `/api/items/low-stock` | Auth | Alert list for items below critical threshold |
| `POST` | `/api/purchase-orders` | Admin | Create PO, calculate ITC & atomically increment stock |
| `POST` | `/api/requisitions` | Engineer | Submit spare parts requisition |
| `PUT` | `/api/requisitions/:id/approve` | Admin | Atomically approve requisition and deduct stock |
| `GET` | `/api/reports/monthly-spend` | Admin | Aggregate monthly procurement spend & ITC audit |
| `GET` | `/api/health` | Public | System uptime & health check endpoint |
| `GET` | `/api-docs` | Public | Interactive OpenAPI 3.0 (Swagger UI) dashboard |

---

## 💼 Placement Resume Points (STAR / XYZ Format)

Use these bullet points directly on your resume for Software Development Engineer (SDE / Backend) roles:

> - **Engineered an enterprise mining supply chain REST API** using Node.js, Express, PostgreSQL, and Prisma ORM, implementing an N-Tier layered architecture with 100% test coverage across 34 E2E integration test cases.
> - **Eliminated concurrency race conditions and inventory stock anomalies** by designing atomic database transactions (`$transaction`) with optimistic validation, ensuring zero phantom deductions during high-frequency site requisitions.
> - **Architected a multi-rate GST & Input Tax Credit (ITC) financial computation engine**, automating monthly procurement tax audits and purchase order tracking across multi-supplier catalogs.
> - **Hardened API security posture** by implementing stateless JWT Role-Based Access Control (RBAC), Zod request schema validation, Helmet HTTP headers, dynamic CORS, and centralized operational error masking.
> - **Established production-ready CI/CD pipelines and containerization** via GitHub Actions, multi-stage Docker builds, and Render/Railway infrastructure manifests for automated cloud deployments.

---

## 🎤 Interview Talking Points & Deep Dives

### Q1: Why use Prisma interactive transactions instead of standard updates?
> **Answer**: In a supply chain system, checking stock and deducting it across two separate queries leaves a race condition window where two concurrent requests could both see sufficient stock and deduct simultaneously, resulting in negative inventory. Prisma interactive transactions wrap the read, validation, state transition, and decrement inside an atomic database transaction boundary, ensuring ACID isolation.

### Q2: How did you design your validation layer?
> **Answer**: Rather than scattering validation logic inside controllers, I implemented a centralized validation middleware using Zod. The middleware validates request body, query parameters, and URL route parameters against strongly-typed schemas before the controller is executed, immediately rejecting malformed payloads with 400 Bad Request.

### Q3: How is production logging handled without leaking sensitive data?
> **Answer**: Logging is managed via Winston with dual transports (formatted console logs for development, structured JSON rotated files for production). Operational errors capture HTTP context and status codes while stripping out stack traces and internal database error messages when `NODE_ENV === 'production'`.

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- Node.js >= 20.x LTS
- PostgreSQL >= 15.x

```bash
# 1. Clone the repository
git clone https://github.com/ZeeshaAzhar01/Mine_Inventory.git
cd Mine_Inventory

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env

# 4. Apply database migrations
npx prisma migrate dev

# 5. Start development server
npm run dev

# 6. Run comprehensive E2E test suite
npm test
```

Interactive API documentation will be available at [http://localhost:3000/api-docs](http://localhost:3000/api-docs).

---

## 📦 Containerization & Cloud Deployment

### Run with Docker
```bash
docker build -t mining-inventory-api .
docker run -p 3000:3000 -e DATABASE_URL="postgresql://user:pass@host:5432/db" mining-inventory-api
```

### Deploy to Render / Railway
This repository includes [`render.yaml`](render.yaml) and [`railway.json`](railway.json) blueprints for automated 1-click cloud deployment.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
