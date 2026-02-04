# Twinkle Setup Guide

This guide gets you from clone to a running app. Twinkle is a **Next.js monolith**: one app with the App Router and API routes; there is no separate backend server.

---

## Quick Start

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up PostgreSQL**

   Ensure PostgreSQL is running, then create the database:

   ```bash
   psql postgres
   CREATE DATABASE twinkle;
   \q
   ```

3. **Configure environment**

   Copy the example env and edit with your DB credentials:

   ```bash
   cp .env.example .env
   ```

   In `.env` set at least:

   ```env
   DATABASE_URL="postgresql://your_username:your_password@localhost:5432/twinkle?schema=public"
   JWT_SECRET="your-super-secret-jwt-key-change-in-production"
   NODE_ENV=development
   ```

4. **Initialize database**

   ```bash
   npm run prisma:generate
   npm run prisma:push
   ```

5. **Create upload directories** (or run full setup)

   ```bash
   mkdir -p public/uploads/profiles public/uploads/banners public/uploads/thumbnails
   ```

   Or in one go:

   ```bash
   npm run setup
   ```
   (`npm run setup` also runs install, prisma generate, and prisma push.)

6. **Start the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

---

## Creating Your First Creator Account

1. Sign up with a new email via the app.
2. Promote the user to `creator` in the database:

   **Option A – SQL**

   ```sql
   UPDATE users SET role = 'creator' WHERE email = 'your-email@example.com';
   ```

   **Option B – Prisma Studio**

   ```bash
   npm run prisma:studio
   ```

   Open the `users` table and set the user’s `role` to `creator`.

Creator Studio routes (`/studio`, `/studio/upload`, etc.) exist; some Studio features may still be minimal or work-in-progress.

---

## Testing the Platform

- **As a Viewer:** Browse the home feed, search, watch videos, sign up and sign in. Watch history is stored (DB when logged in, localStorage for guests). Profile, library, saved, and subscriptions routes may be placeholder pages.
- **As a Creator:** After setting role to `creator`, log in and use the sidebar to reach Creator Studio. You can upload videos and manage content; exact feature set depends on current implementation.
- **As an Admin:** Set role to `admin` in the database. Admin capabilities are currently basic (e.g. user checks and resets via APIs); there is no full in-app admin dashboard yet.

---

## File Structure

```
/app                    # Next.js App Router: pages and API routes
  /api                  # API routes (auth, videos, history, admin, upload, user)
  /auth, /creator, /history, /library, /playlist, /profile, /search, /studio, /subscriptions, /watch
/components             # React components
  /layout               # Header, Sidebar, MainContent, BottomNavbar, HeaderSearch, HeaderProfileMenu, MobileMenu
  /modals               # ShareModal, ReportModal, PurchaseFlowModal
  /history              # ClearHistoryModal, PauseHistoryModal, etc.
  /monetization         # PaymentFormCard, PaymentFormWallet, PaymentSuccessReceipt, PaymentSMSVerification, types
  /watch                # Watch page sections (WatchPageAboveFold, WatchPageRelated, etc.)
  /ui                   # Shared UI primitives (button, input, dialog, etc.)
/config                 # viewerConstants.ts – viewer/demo defaults (saved cards, donation amounts, mock account)
/contexts               # AuthContext, ModalContext, SidebarContext, MiniplayerContext, PurchaseContext
/hooks                  # useWatchHistoryTracker, etc.
/lib                    # Utilities: utils.ts, viewerUtils.ts (formatting, card/phone helpers), auth, prisma, watchHistory
/prisma                 # Database schema
/public                 # Static assets and uploads (profiles, banners, thumbnails, videos)
/scripts                # check-z-index, reset-default-user, setup-twinkle-creator, import-youtube-creator, etc.
/types                  # Shared TypeScript types
```

---

## Troubleshooting

- **Database connection:** Ensure PostgreSQL is running (`pg_isready`), `DATABASE_URL` in `.env` is correct, and the `twinkle` database exists. See [DATABASE_SETUP.md](./DATABASE_SETUP.md).
- **Prisma:** After schema changes run `npm run prisma:generate` and `npm run prisma:push`.
- **Uploads:** Ensure `public/uploads/` directories exist and file size limits in Next.js config are suitable for your use case.
- **Auth / sign-in:** See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Generate Prisma client and build for production |
| `npm run start` | Start production server |
| `npm run setup` | Install deps, prisma generate, prisma push, create upload dirs |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:push` | Push schema to database |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run reset:user` | Reset users and create default user |
| `npm run setup:twinkle` | Set up Twinkle creator |
| `npm run check:z-index` | Check z-index architecture compliance |
| `npm run check:videos` | Check videos script |

---

## Next Steps

Once the app runs locally, consider production environment variables, cloud storage for video files, transcoding, email verification, subscriptions, and other product priorities. The codebase is structured so these can be added incrementally.
