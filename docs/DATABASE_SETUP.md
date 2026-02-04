# Database Setup & Sign-In Fix Guide

This guide covers database setup, connection troubleshooting, and sign-in fixes for the Twinkle MVP.

## Schema Overview

The Prisma schema includes:
- **users** - User accounts (viewer, creator, admin roles)
- **videos** - Video metadata and file references
- **analytics** - View tracking
- **watch_history** - Watch history for logged-in users (videoId, progress, lastWatchedAt)

Watch history is stored in the database for authenticated users; guests use localStorage (last 50 videos).

## ✅ FIXED: Database Connection Issue

**The issue was:** The `.env` file had `DATABASE_URL="postgresql://postgres:password@localhost:5432/twinkle"` but the actual PostgreSQL user is your macOS username (e.g., `Bekha`).

**The fix:** Updated DATABASE_URL to use the correct username: `DATABASE_URL="postgresql://Bekha@localhost:5432/twinkle?schema=public"`

## Issue: Database Connection Error

The error `User was denied access on the database (not available)` indicates a database connection problem.

## Step 1: Verify PostgreSQL is Running

```bash
# Check if PostgreSQL is running
pg_isready

# If not running, start it:
# macOS with Homebrew:
brew services start postgresql@14
# or
brew services start postgresql

# Linux:
sudo systemctl start postgresql
```

## Step 2: Check/Create .env File

The `.env` file should be in the project root.

**Create or verify `.env` file:**

If `.env` doesn't exist, create it:

```bash
cat > .env << 'EOF'
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/twinkle?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
NODE_ENV=development
EOF
```

**Replace:**
- `YOUR_USERNAME` - Your PostgreSQL username (usually your macOS username)
- `YOUR_PASSWORD` - Your PostgreSQL password (if you set one, otherwise leave empty)
- `twinkle` - Database name (create it if it doesn't exist)

## Step 3: Create Database (if it doesn't exist)

```bash
# Connect to PostgreSQL
psql postgres

# In psql prompt, run:
CREATE DATABASE twinkle;

# Exit psql
\q
```

**If you get "role does not exist" error:**
```bash
# Create a PostgreSQL user (replace 'your_username' with your macOS username)
psql postgres
CREATE USER your_username WITH PASSWORD '';
ALTER USER your_username CREATEDB;
\q
```

## Step 4: Test Database Connection

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (this will create tables)
npx prisma db push
```

If this succeeds, your database connection is working!

## Step 5: Create Default User

Once the database connection works, you can create the default user:

**Option A: Using the script (recommended)**
```bash
npm run reset:user
```

**Option B: Using the API endpoint (if server is running)**
```bash
# Start your dev server first, then:
curl -X POST http://localhost:3000/api/admin/reset-users
```

**Option C: Manual SQL (if needed)**
```bash
psql twinkle

# In psql, run:
INSERT INTO users (id, email, "passwordHash", role, name, "createdAt", "updatedAt")
VALUES (
  'default-user-id',
  'yupbekha@twinkle.uz',
  '$2a$10$...', -- You'll need to hash the password first
  'viewer',
  'yupbekha',
  NOW(),
  NOW()
);
```

## Step 6: Test Sign-In

Once the user is created, try signing in with:
- **Email:** `yupbekha@twinkle.uz`
- **Username:** `yupbekha` or `@yupbekha`
- **Password:** `#User123`

## Common Issues

### Issue: "database does not exist"
**Solution:** Create the database (Step 3)

### Issue: "role does not exist"
**Solution:** Create a PostgreSQL user or use your macOS username

### Issue: "password authentication failed"
**Solution:** 
- Check your password in `.env`
- Try empty password: `postgresql://username@localhost:5432/twinkle`
- Reset PostgreSQL password if needed

### Issue: "connection refused"
**Solution:**
- PostgreSQL is not running - start it (Step 1)
- Wrong port - check if PostgreSQL is on port 5432

## Quick Test Commands

```bash
# Test PostgreSQL connection
psql -U your_username -d twinkle -c "SELECT 1;"

# List all databases
psql -U your_username -l

# Check if twinkle database exists
psql -U your_username -l | grep twinkle
```

## After Database is Working

1. Run `npx prisma db push` to create tables
2. Run `npm run reset:user` to create default user
3. Try signing in with the credentials above
