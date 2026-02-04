# Database Setup & Sign-In Guide

This guide covers PostgreSQL setup, Prisma, and sign-in for Twinkle. You need a working database connection before the app can authenticate users or store watch history.

---

## Schema Overview

The Prisma schema includes:

- **users** — Accounts (viewer, creator, admin roles).
- **videos** — Video metadata and file references.
- **analytics** — View tracking.
- **watch_history** — Watch history for logged-in users (videoId, progress, lastWatchedAt).

Watch history is stored in the database for authenticated users; guests use localStorage (last 50 videos).

---

## Common Database Connection Issues

Typical errors you may see:

- **“database does not exist”** — The `twinkle` database has not been created.
- **“role does not exist”** — The username in `DATABASE_URL` is not a valid PostgreSQL role.
- **“password authentication failed”** — Wrong password in `.env`, or the user has no password set.
- **“connection refused”** — PostgreSQL is not running, or the port (default 5432) is wrong.

The rest of this guide walks through fixing these step by step.

---

## Step 1: Verify PostgreSQL is Running

```bash
pg_isready
```

If it fails, start PostgreSQL:

- **macOS (Homebrew):** `brew services start postgresql@14` or `brew services start postgresql`
- **Linux:** `sudo systemctl start postgresql`
- **Windows:** Start the PostgreSQL service from Services or your installer.

---

## Step 2: Configure .env

Create `.env` in the project root (copy from `.env.example` if present). You need at least:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/twinkle?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
NODE_ENV=development
```

- **USERNAME** — Your PostgreSQL username (often your OS username, or a dedicated DB user like `twinkle_user`).
- **PASSWORD** — That user’s password. If the user has no password, use `postgresql://USERNAME@localhost:5432/twinkle?schema=public` (no `:PASSWORD`).

A very common sign-in failure is using the wrong PostgreSQL user in `DATABASE_URL` (e.g. a generic `postgres` user when your system expects a different role). Use the same username you would use for `psql -U USERNAME`.

---

## Step 3: Create Database and Role (if needed)

**Create the database:**

```bash
psql postgres
```

In the `psql` prompt:

```sql
CREATE DATABASE twinkle;
\q
```

**If you get “role does not exist”:** Create a PostgreSQL role and grant it access. Replace `twinkle_user` and the password with values you will use in `.env`:

```bash
psql postgres
```

```sql
CREATE USER twinkle_user WITH PASSWORD 'your_secure_password';
ALTER USER twinkle_user CREATEDB;
\q
```

Then set `DATABASE_URL` to use `twinkle_user` and that password.

---

## Step 4: Test Prisma & Migrations

Generate the Prisma client and push the schema to the database:

```bash
npm run prisma:generate
npm run prisma:push
```

If these succeed, your database connection is working and the tables exist.

---

## Step 5: Create Default User

**Option A: Script (recommended)**

```bash
npm run reset:user
```

This removes existing users and creates a single default user. The script prints the login credentials (email and password) to the console.

**Option B: API endpoint (if the dev server is running)**

```bash
curl -X POST http://localhost:3000/api/admin/reset-users
```

**Option C: Manual SQL**

Connect to the database and insert a user. The password must be a bcrypt hash; you can generate one in Node with `require('bcryptjs').hashSync('your_password', 10)`.

```sql
-- Example; replace id, email, passwordHash, name with your values
INSERT INTO users (id, email, "passwordHash", role, name, "createdAt", "updatedAt")
VALUES (
  'your-generated-uuid',
  'test@example.com',
  '$2a$10$...',  -- bcrypt hash of the password
  'viewer',
  'testuser',
  NOW(),
  NOW()
);
```

---

## Step 6: Test Sign-In

After creating a user:

1. Start the app: `npm run dev`.
2. Open [http://localhost:3000](http://localhost:3000).
3. Sign in with the credentials from the reset script output (Option A), or with the email/password you used in Option B or C.

You can sign in with email or with the username (with or without `@`). If sign-in still fails, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

---

## Quick Reference / Troubleshooting

- **“database does not exist”** → Create the database (Step 3).
- **“role does not exist”** → Create a PostgreSQL user/role (Step 3) or use an existing username in `DATABASE_URL`.
- **“password authentication failed”** → Check `USERNAME` and `PASSWORD` in `.env`; try no password if the role has none; reset the DB user’s password if needed.
- **“connection refused”** → PostgreSQL is not running (Step 1) or the port in `DATABASE_URL` is wrong (default 5432).

**Quick test:** `psql -U USERNAME -d twinkle -c "SELECT 1;"` (use the same `USERNAME` as in `.env`).
