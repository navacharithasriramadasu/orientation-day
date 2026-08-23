# Orientation Day - 2026 Batch QR Registration, Eligibility Verification & Entrance Attendance System

A reliable, secure, free, and open-source Orientation Day - 2026 Batch QR Registration, Eligibility Verification, and Entrance Attendance System designed for candidate check-ins.

---

## 🌟 Core Business Principle

> **Master Source of Truth**: The administrator-uploaded candidate/payment-status file (`.csv` or `.xlsx`) is the **absolute master source of truth**. Candidates can **never** self-register, modify, or override official candidate data.

### Mandatory Workflow Engine
```
Official Candidate Data -> Payment Status -> Eligibility Engine -> Secure QR Token -> Entrance Scan -> Server-side Validation -> Attendance Recorded
```

- **Payment Status Normalization**:
  - `PAID`, `Paid`, `paid`, `PAID ` -> Normalized `PAID` => **ELIGIBLE** (`true`)
  - `Not Paid`, `not paid`, `NOT PAID`, `Not_Paid` -> Normalized `NOT_PAID` => **NOT ELIGIBLE** (`false`)
  - `Partially Paid`, `partially paid`, `PARTIALLY PAID`, `Partiallly Paid` (handles typo) -> Normalized `PARTIALLY_PAID` => **NOT ELIGIBLE** (`false`)
  - Any unknown payment value defaults to `NOT_PAID` => **NOT ELIGIBLE** (`false`)

- **Fresh Real-Time Backend Scan Validation**:
  A QR code does **not** grant automatic entrance. Every entrance scan executes a real-time 8-step backend check verifying token existence, active QR status, active event status, current candidate payment status (`PAID`), current eligibility, and duplicate attendance prevention.

- **Database-Level Unique Constraints**:
  A unique database constraint `(candidate_id, event_id)` on the `Attendance` table prevents duplicate attendance even under high-concurrency requests.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, html5-qrcode, qrcode.react, html2canvas
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, Multer, XLSX / CSV-Parse, bcryptjs, JSON Web Tokens (JWT)
- **Database**: SQLite (MVP), fully compatible with PostgreSQL via Prisma ORM
- **Cost**: 100% Free & Open-Source (Zero paid APIs, zero external proprietary dependencies)

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisite
Ensure Node.js (v18+) and `npm` are installed on your machine.

### 2. Install Dependencies
```bash
# Install root, backend, and frontend dependencies
npm run install:all
```

### 3. Database Migration & Setup
```bash
# Generate Prisma Client & Run SQLite Migration
npm run db:migrate
```

### 4. Seed Admin Account & Dummy Test Candidates
```bash
# Seed initial administrator account (admin@graduation.edu / Admin@2026Password!)
npm run seed:admin

# Seed ~1,000 dummy candidates matching official MVSR PDF layout & test cases
npm run seed
```

### 5. Launch Development Servers
```bash
# Runs backend API (port 5000) and frontend Vite server (port 3000) concurrently
npm run dev
```

Open your browser to:
- **Student Portal**: `http://localhost:3000/register`
- **Admin Portal**: `http://localhost:3000/admin/login`

---

## 🔑 Default Administrator Credentials

| Role | Username | Default Password |
| :--- | :--- | :--- |
| **Admin** | `admin@graduation.edu` | `Admin@2026Password!` |

---

## 🧪 Running Automated Tests

The repository includes an end-to-end automated test suite testing all **7 mandatory test cases** defined in Section 48:

1. **Test 1 — Paid Candidate**: Candidate `GD001` (`Paid`) -> Eligible -> Obtains QR -> Scan succeeds.
2. **Test 2 — Duplicate Scan**: Scanning `GD001` QR a second time -> Returns `DUPLICATE` & blocks second entry in DB.
3. **Test 3 — Not Paid**: Candidate `GD002` (`Not Paid`) -> Returns `NOT_ELIGIBLE` -> QR registration blocked.
4. **Test 4 — Partially Paid**: Candidate `GD003` / `GD004` (`Partiallly Paid` spelling variation) -> Normalized to `PARTIALLY_PAID` -> Registration blocked.
5. **Test 5 — Invalid QR**: Scanning unknown random token -> Returns `INVALID`.
6. **Test 6 — Dynamic Payment Update**: Candidate changes `NOT_PAID` -> `PAID` (becomes eligible, obtains QR) -> Update back to `NOT_PAID` -> Scanning existing QR token fails immediately.
7. **Test 7 — Duplicate Student ID Import**: Importing file with duplicate Student IDs -> Preview identifies duplicates & blocks silent insertion.

```bash
# Execute Vitest suite
npm test
```

---

## 🐘 Migrating SQLite to PostgreSQL

The MVP uses SQLite for zero-configuration local execution. Because Prisma ORM abstracts all database interactions, migrating to PostgreSQL in production requires only two steps:

1. Update `backend/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Update `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/graduation2026?schema=public"
   ```
3. Run `npx prisma migrate dev --name init_pg`.

---

## 🔒 Security & Privacy Features

- **No Sensitive PII in QR Codes**: QR codes contain **only** a 64-character cryptographically secure random token generated via `crypto.randomBytes(32)`. Name, Student ID, Phone, Email, and Payment details are **never** encoded inside the QR image.
- **BCrypt Password Hashing**: Administrator credentials are saved using salted BCrypt hashes.
- **JWT Authorization**: Admin management and scan endpoints require valid Bearer JWT authentication.
- **Parameterized SQL Queries**: All database queries are handled through Prisma ORM to prevent SQL injection.
