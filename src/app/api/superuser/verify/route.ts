import { NextResponse } from 'next/server';
export async function POST(req: Request) {
  const { password } = await req.json();
  if (password === process.env.SUPER_USER_PASS) return NextResponse.json({ success: true });
  return NextResponse.json({ success: false }, { status: 403 });
}