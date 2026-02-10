import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function middleware(request: NextRequest) {
  // Only protect /studio and /upload
  if (
    !request.nextUrl.pathname.startsWith('/studio') &&
    !request.nextUrl.pathname.startsWith('/upload')
  ) {
    return NextResponse.next();
  }

  const token =
    request.cookies.get('twinkle_token')?.value ??
    request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string | undefined;
    if (role !== 'creator' && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  } catch {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/studio/:path*', '/upload/:path*'],
};
