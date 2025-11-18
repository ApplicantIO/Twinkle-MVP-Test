# Twinkle MVP - Video Platform for Uzbekistan

A desktop-first video-sharing platform inspired by YouTube, built with Next.js, TypeScript, and PostgreSQL.

## Features

- **YouTube-style Interface**: Dark theme with familiar navigation patterns
- **Video Playback**: Full-featured video player with controls
- **Creator Studio**: Dashboard for creators to manage content
- **User Authentication**: Email/password signup and login
- **Role-based Access**: Viewer, Creator, and Admin roles
- **Video Upload**: Upload videos with thumbnails and metadata
- **Search**: Search videos by title and description
- **Creator Profiles**: Public channel pages for creators

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS with custom dark theme
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Storage**: Local file system (public/uploads)

## Prerequisites

- Node.js 20.9.0 or higher
- PostgreSQL 12 or higher
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

Create a PostgreSQL database:

```bash
psql postgres
CREATE DATABASE twinkle;
\q
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and update with your database credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/twinkle?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
NODE_ENV=development
```

### 4. Initialize Database

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push
```

### 5. Create Upload Directories

```bash
mkdir -p public/uploads/profiles
mkdir -p public/uploads/banners
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## User Roles

### Viewer (Default)
- Browse and watch videos
- Search videos
- Sign up and login

### Creator
- All viewer capabilities
- Upload videos
- Manage own videos (edit/delete)
- Access Creator Studio
- Update channel profile

### Admin
- All creator capabilities
- Approve creators (via database)
- Manage all users and videos

## Project Structure

```
/app
  /api          # API routes
  /auth         # Authentication pages
  /studio       # Creator Studio pages
  /watch        # Video watch pages
  /creator      # Creator profile pages
  /search       # Search page
/components    # React components
/lib           # Utilities and helpers
/prisma        # Database schema
/public        # Static files and uploads
```

## API Routes

- `POST /api/auth/signup` - Create new account
- `POST /api/auth/signin` - Login
- `GET /api/auth/me` - Get current user
- `GET /api/videos` - List videos (supports ?search=, ?userId=)
- `GET /api/videos/[id]` - Get video details
- `POST /api/videos` - Create video (creator only)
- `PATCH /api/videos/[id]` - Update video (owner/admin only)
- `DELETE /api/videos/[id]` - Delete video (owner/admin only)
- `POST /api/upload` - Upload video file (creator only)
- `PATCH /api/user/profile` - Update user profile

## Design System

### Colors
- Background: `#0F0F0F`
- Surface: `#1A1A1A`
- Text Primary: `#FFFFFF`
- Text Secondary: `#CCCCCC`
- Accent (Twinkle Purple): `#947CF2`
- Error: `#FF4D4D`

### Typography
- Font: Inter
- H1: 28px
- H2: 22px
- Body: 16px
- Small: 14px

## Development

### Build for Production

```bash
npm run build
npm start
```

### Database Migrations

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy
```

### Prisma Studio

View and edit database data:

```bash
npx prisma studio
```

## Notes

- This MVP is **desktop-only** - mobile responsiveness is not implemented
- Video files are stored locally in `public/uploads/` - consider cloud storage for production
- Admin features require direct database access to change user roles
- Search is basic text matching - consider full-text search for production

## License

Proprietary - Twinkle Uzbekistan
# Twinkle-MVP-Test
