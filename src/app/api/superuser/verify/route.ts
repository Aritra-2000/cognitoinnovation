import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    // Compare with .env variable
    const isValid = password === process.env.SUPER_USER_PASSWORD;

    return NextResponse.json(
      {
        ok: isValid,
        message: isValid ? 'Authentication successful' : 'Invalid password',
      },
      { status: isValid ? 200 : 401 }
    );
  } catch (error) {
    console.error('Error in superuser verification:', error);
    return NextResponse.json(
      { ok: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
