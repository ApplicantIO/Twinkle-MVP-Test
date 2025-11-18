# 🚀 Quick Start Guide

Follow these steps to get Twinkle MVP running on your machine.

## Prerequisites Check

Make sure you have installed:
- ✅ Node.js (v18+) - Check with: `node --version`
- ✅ PostgreSQL (v12+) - Check with: `psql --version`
- ✅ npm - Check with: `npm --version`

## Step 1: Install Dependencies

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

## Step 2: Set Up Database

1. **Start PostgreSQL** (if not running)
   ```bash
   # macOS with Homebrew
   brew services start postgresql@14
   
   # Or check if running
   pg_isready
   ```

2. **Create the database**
   ```bash
   # Connect to PostgreSQL
   psql postgres
   
   # In psql, run:
   CREATE DATABASE twinkle;
   \q
   ```

3. **Create `.env` file in `backend/` directory**
   ```bash
   cd backend
   # Create .env file (copy from ENV_SETUP.md or create manually)
   ```

   Add this content to `backend/.env`:
   ```env
   DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/twinkle?schema=public"
   JWT_SECRET="your-super-secret-jwt-key-change-in-production"
   PORT=5000
   NODE_ENV=development
   ```
   
   **Replace `YOUR_USERNAME` and `YOUR_PASSWORD` with your PostgreSQL credentials!**

## Step 3: Initialize Database

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Create admin user
npm run seed:admin
```

You should see: `✅ Admin user created: admin@twinkle.uz`

## Step 4: Start the Servers

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

You should see: `🚀 Server is running on http://localhost:5000`

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

You should see the Vite dev server running (usually on `http://localhost:3000`)

## Step 5: Access the Application

1. Open your browser and go to: **http://localhost:3000**

2. **Test the app:**
   - Sign up a new user
   - Login as admin: `admin@twinkle.uz` / `admin123`
   - Create a creator profile
   - Approve creators in the admin dashboard
   - Upload videos as an approved creator
   - Browse published videos

## 🐛 Troubleshooting

### Database Connection Error
- Make sure PostgreSQL is running: `pg_isready`
- Check your `.env` file has correct credentials
- Verify database exists: `psql -l | grep twinkle`

### Port Already in Use
- Backend: Change `PORT` in `backend/.env`
- Frontend: Change port in `frontend/vite.config.ts`

### Module Not Found
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

### Prisma Errors
- Run: `npx prisma generate` again
- Check database connection in `.env`

## 📝 Default Admin Credentials

- **Email:** `admin@twinkle.uz`
- **Password:** `admin123`

**⚠️ Change these in production!**

