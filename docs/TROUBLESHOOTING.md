# Sign-In Troubleshooting Guide

## Common Issues and Solutions

### Issue: Sign-in not working

**Possible Causes:**

1. **User doesn't exist in database**
   - Solution: Run `npm run reset:user` to create the default user
   - Verify user exists: Check server logs or use `/api/admin/check-user?email=yupbekha@twinkle.uz`

2. **Password mismatch**
   - Default password: `#User123` (case-sensitive, includes `#`)
   - Ensure no extra spaces before/after password
   - Check server logs for password verification results

3. **Database connection issues**
   - Verify `.env` file has correct `DATABASE_URL`
   - Ensure database is running and accessible
   - Check Prisma connection: `npx prisma db push`
   - See [DATABASE_SETUP.md](./DATABASE_SETUP.md)

4. **Identifier format**
   - Try logging in with:
     - Email: `yupbekha@twinkle.uz`
     - Username: `yupbekha` (without @)
     - Username: `@yupbekha` (with @ - will be stripped automatically)

**Debug Steps:**

1. **Check server logs** (if `NODE_ENV=development`):
   - Look for `[SIGNIN]` log messages
   - Verify user lookup results
   - Check password verification results

2. **Verify user exists:**
   ```bash
   # If server is running, visit:
   http://localhost:3000/api/admin/check-user?email=yupbekha@twinkle.uz
   ```

3. **Reset user:**
   ```bash
   npm run reset:user
   ```

4. **Check browser console:**
   - Look for network errors
   - Check for JavaScript errors
   - Verify API response

**Default Credentials:**
- Username: `yupbekha` or `@yupbekha`
- Email: `yupbekha@twinkle.uz`
- Password: `#User123`

These defaults are created by the `npm run reset:user` script and may change in future; check the script output or [DATABASE_SETUP.md](./DATABASE_SETUP.md) for the latest values.
