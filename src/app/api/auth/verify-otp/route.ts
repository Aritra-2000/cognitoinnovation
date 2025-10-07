import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();
    if (typeof email !== 'string' || typeof otp !== 'string') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    // TODO: verify hashed OTP from DB, upsert user, issue session/jwt
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}


