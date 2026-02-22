import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { subscribeToCreator } from '@/lib/firebase/subscriptions';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const creatorId = typeof body?.creatorId === 'string' ? body.creatorId : null;
    if (!creatorId) {
      return NextResponse.json({ error: 'creatorId required' }, { status: 400 });
    }

    const payload = verifyToken(token);
    await subscribeToCreator(payload.id, creatorId);
    return NextResponse.json({ subscribed: true });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 }
    );
  }
}
