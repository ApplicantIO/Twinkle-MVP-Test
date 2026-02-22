import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { isSubscribed } from '@/lib/firebase/subscriptions';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ subscribed: false }, { status: 200 });
    }

    const creatorId = request.nextUrl.searchParams.get('creatorId');
    if (!creatorId) {
      return NextResponse.json({ subscribed: false }, { status: 200 });
    }

    const payload = verifyToken(token);
    const subscribed = await isSubscribed(payload.id, creatorId);
    return NextResponse.json({ subscribed });
  } catch {
    return NextResponse.json({ subscribed: false }, { status: 200 });
  }
}
