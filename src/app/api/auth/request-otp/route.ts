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

    // Send OTP via email. In development, if sending fails, log OTP and continue.
    try {
      await sendEmail({
        to: email,
        subject: 'Your Login OTP',
        text: `Your OTP is ${otp}. It expires in 5 minutes.`,
        content: `<p>Your OTP is <strong>${otp}</strong>. It expires in 5 minutes.</p>`
      });
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Email send failed in dev; proceeding. OTP:', otp, 'Recipient:', email);
      } else {
        throw e;
      }
    }

    return NextResponse.json({ ok: true, userId: user.id, devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined });
  } catch (error) {
    console.error('request-otp error:', error);
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


