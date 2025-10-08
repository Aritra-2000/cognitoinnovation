"use client";
import { useEffect, useState } from 'react';

export default function Home() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email"|"otp"|"done">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  async function requestOtp() {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!res.ok) throw new Error('Failed to request OTP');
      setStep('otp');
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      if (!res.ok) throw new Error('Invalid OTP');
      setStep('done');
      window.location.href = '/dashboard';
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Login</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {step === 'email' && (
          <div className="space-y-3">
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
            <button
              className="w-full bg-black text-white rounded px-3 py-2 disabled:opacity-50"
              onClick={requestOtp}
              disabled={loading || !email.includes('@')}
            >
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
          </div>
        )}
        {step === 'otp' && (
          <div className="space-y-3">
            <input
              className="w-full border rounded px-3 py-2 tracking-widest"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              inputMode="numeric"
              maxLength={6}
            />
            <button
              className="w-full bg-black text-white rounded px-3 py-2 disabled:opacity-50"
              onClick={verifyOtp}
              disabled={loading || otp.length !== 6}
            >
              {loading ? 'Verifying…' : 'Verify'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
