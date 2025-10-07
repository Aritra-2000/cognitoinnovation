import crypto from 'crypto';

const OTP_LENGTH = 6;
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function generateOtp(): string {
	// Generates a 6-digit numeric OTP, zero-padded
	const random = crypto.randomInt(0, 10 ** OTP_LENGTH);
	return random.toString().padStart(OTP_LENGTH, '0');
}

export function hashOtp(otp: string, salt?: string): { hash: string; salt: string } {
	const usedSalt = salt ?? crypto.randomBytes(16).toString('hex');
	const hash = crypto
		.createHmac('sha256', usedSalt)
		.update(otp)
		.digest('hex');
	return { hash, salt: usedSalt };
}

export function verifyOtp(otp: string, hash: string, salt: string): boolean {
	const recomputed = hashOtp(otp, salt).hash;
	return crypto.timingSafeEqual(Buffer.from(recomputed, 'hex'), Buffer.from(hash, 'hex'));
}

export function getExpiryDate(now: Date = new Date()): Date {
	return new Date(now.getTime() + OTP_TTL_MS);
}


