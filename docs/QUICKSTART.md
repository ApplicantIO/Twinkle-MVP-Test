# Quick Start Guide

Follow these steps to get Twinkle MVP running on your machine.

## Prerequisites

- Node.js v18+ (`node --version`)
- PostgreSQL v12+ (`psql --version`)
- npm (`npm --version`)

## Step 1: Install Dependencies

```bash
cd Twinkle-MVP-Test
npm install
```

## Step 2: Set Up Database

1. **Start PostgreSQL** (if not running)

   ```bash
   # macOS with Homebrew
   brew services start postgresql@14

   # Or verify it's running
   pg_isready
   ```

2. **Create the database**

   ```bash
   psql postgres
   CREATE DATABASE twinkle;
   \q
   ```

3. **Create `.env` file** in project root

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set:

   ```env
   DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/twinkle?schema=public"
   JWT_SECRET="your-super-secret-jwt-key-change-in-production"
   NODE_ENV=development
   ```

   Replace `YOUR_USERNAME` and `YOUR_PASSWORD` with your PostgreSQL credentials.

## Step 3: Initialize Database

```bash
npx prisma generate
npx prisma db push
```

## Step 4: Create Upload Directories

```bash
mkdir -p public/uploads/profiles
mkdir -p public/uploads/banners
mkdir -p public/uploads/thumbnails
```

Or run the full setup:

```bash
npm run setup
```

## Step 5: Create Default User (Optional)

```bash
npm run reset:user
```

This creates a default user. See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for credentials and troubleshooting.

## Step 6: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default User Credentials

- **Username:** `yupbekha` or `@yupbekha`
- **Email:** `yupbekha@twinkle.uz`
- **Password:** `#User123`

Change these in production.

## Troubleshooting

### Database Connection Error

- Verify PostgreSQL is running: `pg_isready`
- Check `.env` has correct `DATABASE_URL`
- See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed steps

### Prisma Errors

```bash
npx prisma generate
npx prisma db push
```

### Reset Users

```bash
npm run reset:user
```

## Project Structure

This is a **Next.js monolith** (single app). There is no separate backend/frontend:

- `app/` - Pages and API routes
- `components/` - React components
- `lib/` - Utilities, Prisma, auth
- `prisma/` - Database schema

## Next Steps

- Upload videos via Creator Studio: `/studio`
- Check architecture: [ARCHITECTURE_RULES.md](./ARCHITECTURE_RULES.md)
- Sign-in issues: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
