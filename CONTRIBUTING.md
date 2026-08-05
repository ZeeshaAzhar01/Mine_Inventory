# Contributing to Mining Inventory & Supply Chain Management API

Thank you for your interest in contributing! This project follows industry best practices for enterprise Node.js/Express and PostgreSQL backends.

---

## 🚀 Development Workflow

1. **Fork and Clone**:
   ```bash
   git clone https://github.com/ZeeshaAzhar01/Mine_Inventory.git
   cd Mine_Inventory
   ```

2. **Branching Strategy**:
   Create a descriptive feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bugfix-name
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Environment Configuration**:
   ```bash
   cp .env.example .env
   ```

5. **Prisma Migrations**:
   When updating `prisma/schema.prisma`, create a new migration:
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```

6. **Running Tests**:
   Ensure all integration tests pass before submitting a pull request:
   ```bash
   npm test
   ```

---

## 📐 Code Style & Architecture Guidelines

- **N-Tier Architecture**: Maintain strict separation of concerns across `controllers`, `services`, `routes`, `middleware`, `validators`, and `config`.
- **Validation**: All incoming request payloads (`body`, `params`, `query`) must be validated using **Zod schemas** mounted via `validate()` middleware.
- **Transactions**: Multi-table state mutations (e.g., procurement, requisitions) must run inside `prisma.$transaction()` to guarantee ACID compliance.
- **Error Handling**: Throw operational errors using `new AppError(message, statusCode)`. Do not use manual `res.status(500)` blocks inside controllers.

---

## 📦 Pull Request Checklist

- [ ] Code compiles and lints without warnings.
- [ ] New endpoints are documented with Swagger JSDoc comments.
- [ ] Database migrations are included if schema changed.
- [ ] End-to-End integration tests (`npm test`) pass 100%.
- [ ] Commit messages are concise, descriptive, and follow conventional commit formats.
