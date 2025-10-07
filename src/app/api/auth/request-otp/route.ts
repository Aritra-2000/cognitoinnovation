import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateOtp, hashOtp, getExpiryDate } from '@/lib/otp';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    const otp = generateOtp();
    const { hash, salt } = hashOtp(otp);
    const expiry = getExpiryDate();

    // Store hashed OTP and expiry on user row, upsert user by email
    const user = await prisma.user.upsert({
      where: { email },
      create: { email, otp: `${salt}:${hash}`, otpExpiry: expiry },
      update: { otp: `${salt}:${hash}`, otpExpiry: expiry },
    });

    // Send OTP via email (best-effort, but if it fails, surface error)
    await sendEmail({
      to: email,
      subject: 'Your Login OTP',
      bodyText: `Your OTP is ${otp}. It expires in 5 minutes.`,
    });

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (error) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}


