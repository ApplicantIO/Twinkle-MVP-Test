# Twinkle MVP Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up PostgreSQL Database

Make sure PostgreSQL is running, then create the database:

```bash
psql postgres
CREATE DATABASE twinkle;
\q
```

### 3. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your database credentials:

```env
DATABASE_URL="postgresql://your_username:your_password@localhost:5432/twinkle?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
NODE_ENV=development
```

### 4. Initialize Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema to database
npm run prisma:push
```

### 5. Create Upload Directories

```bash
mkdir -p public/uploads/profiles
mkdir -p public/uploads/banners
```

Or run the setup script:

```bash
npm run setup
```

### 6. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Creating Your First Creator Account

1. Sign up with a new email
2. In your database, update the user's role to `creator`:

```sql
UPDATE users SET role = 'creator' WHERE email = 'your-email@example.com';
```

Or use Prisma Studio:

```bash
npm run prisma:studio
```

Then navigate to the Users table and change the role field.

## Testing the Platform

1. **As a Viewer:**
   - Browse videos on homepage
   - Search for videos
   - Watch videos
   - Sign up/login

2. **As a Creator:**
   - After updating role to `creator`, login
   - Access Creator Studio from sidebar
   - Upload videos
   - Manage videos (edit/delete)
   - Update channel settings

3. **As an Admin:**
   - Update role to `admin` in database
   - Full access to all features
   - Can manage all users and videos

## File Structure

```
/app
  /api              # Backend API routes
  /auth             # Sign in/up pages
  /studio           # Creator Studio
  /watch            # Video playback
  /creator          # Creator profiles
  /search           # Search results
/components         # React components
/lib                # Utilities
/prisma             # Database schema
/public             # Static files & uploads
```

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in `.env` is correct
- Ensure database `twinkle` exists

### Prisma Issues
- Run `npm run prisma:generate` after schema changes
- Run `npm run prisma:push` to sync schema

### Upload Issues
- Ensure `public/uploads/` directories exist
- Check file permissions
- Verify file size limits (adjust in Next.js config if needed)

### Authentication Issues
- Clear browser localStorage
- Check JWT_SECRET in `.env`
- Verify token expiration (default: 7 days)

## Next Steps

- Set up cloud storage for video files (AWS S3, Cloudinary, etc.)
- Implement video transcoding for multiple qualities
- Add email verification
- Implement subscription system
- Add video comments
- Set up analytics dashboard
- Configure production environment variables

