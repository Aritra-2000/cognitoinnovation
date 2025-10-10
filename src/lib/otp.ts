import crypto from "crypto";

export function generateOtp(length = 6): string {
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
}

export function hashOtp(otp: string) {
  const salt = crypto.randomBytes(8).toString("hex");
  const hash = crypto.createHmac("sha256", salt).update(otp).digest("hex");
  return { salt, hash };
}

export function verifyOtp(otp: string, stored: string) {
  const [salt, hash] = stored.split(":");
  const newHash = crypto.createHmac("sha256", salt).update(otp).digest("hex");
  return newHash === hash;
}

export function getExpiryDate(minutes = 5): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}
