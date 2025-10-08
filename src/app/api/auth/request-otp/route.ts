import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateOtp, hashOtp, getExpiryDate } from '@/lib/otp';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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
      text: `Your OTP is ${otp}. It expires in 5 minutes.`,
      content: `<p>Your OTP is <strong>${otp}</strong>. It expires in 5 minutes.</p>`
    });

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (error) {
    console.error('request-otp error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}


