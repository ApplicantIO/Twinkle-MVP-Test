# YouTube Creator Import Script

This script allows you to import a YouTube creator's profile and videos into Twinkle.

## Prerequisites

1. **Install yt-dlp** (required for fetching YouTube data):
   ```bash
   # macOS
   brew install yt-dlp
   
   # Linux
   pip install yt-dlp
   
   # Windows
   pip install yt-dlp
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Ensure database is set up**:
   ```bash
   npm run prisma:push
   ```

## Usage

```bash
npm run import:youtube <youtube-channel-url>
```

### Example

```bash
npm run import:youtube https://www.youtube.com/@ozimizuz
```

Or using tsx directly:

```bash
npx tsx scripts/import-youtube-creator.ts https://www.youtube.com/@ozimizuz
```

## What the Script Does

1. **Fetches Channel Information**:
   - Channel name
   - Channel description
   - Profile image
   - Banner image (if available)

2. **Creates Creator Account**:
   - Creates a new user account with role "creator"
   - Email format: `youtube_{channelId}@imported.local`
   - Downloads and saves profile image and banner

3. **Imports Videos**:
   - Fetches up to 50 most recent videos
   - Downloads video thumbnails
   - Creates video entries in the database
   - Uses YouTube embed URLs (videos play via YouTube embed)

## Notes

- **Video Files**: The script does NOT download actual video files. Videos are embedded from YouTube using iframe embeds. This is legal and doesn't violate YouTube's Terms of Service.
- **Duplicate Prevention**: If a creator or video already exists, the script will skip it or update existing entries.
- **Thumbnails**: Video thumbnails are downloaded and stored locally in `public/uploads/thumbnails/`.
- **Profile Images**: Profile images and banners are stored in `public/uploads/profiles/` and `public/uploads/banners/`.

## Troubleshooting

### "yt-dlp is not installed"
Make sure yt-dlp is installed and available in your PATH. Test with:
```bash
yt-dlp --version
```

### "Failed to fetch channel information"
- Check that the YouTube URL is correct
- Ensure you have internet connection
- Try the full channel URL format: `https://www.youtube.com/@channelname` or `https://www.youtube.com/c/channelname`

### Database Errors
- Ensure your database is running
- Check your `.env` file has correct `DATABASE_URL`
- Run `npm run prisma:push` to ensure schema is up to date

## After Import

Once imported, you can:
- View the creator profile at `/creator/{creatorId}`
- Watch videos (they'll play via YouTube embed)
- The creator account can be used to log in (though password is auto-generated)

**Note**: To log in as the imported creator, you'll need to reset the password through the database or create a proper login flow for imported accounts.

