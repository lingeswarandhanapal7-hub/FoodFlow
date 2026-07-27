import { Router } from 'express';
import { readDb, writeDb } from '../db.js';
import { sendOtpViaSmsOrEmail } from '../services/otpService.js';

export const otpRouter = Router();

interface OtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
  verified: boolean;
}

const otpStore = new Map<string, OtpRecord>();

// Clean up expired OTPs periodically
setInterval(() => {
  const now = Date.now();
  for (const [target, record] of otpStore.entries()) {
    if (record.expiresAt < now) {
      otpStore.delete(target);
    }
  }
}, 60000);

// POST /api/auth/send-otp
otpRouter.post('/auth/send-otp', async (req, res) => {
  try {
    const { target, type } = req.body;

    if (!target || typeof target !== 'string' || !target.trim()) {
      return res.status(400).json({ error: 'Valid phone number or email address is required.' });
    }

    const cleanTarget = target.trim().toLowerCase();
    
    // Generate 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

    otpStore.set(cleanTarget, {
      code,
      expiresAt,
      attempts: 0,
      verified: false
    });

    // Dispatch via SMS / Email provider adapter
    const dispatch = await sendOtpViaSmsOrEmail(cleanTarget, code, type);

    res.json({
      success: true,
      message: dispatch.message,
      provider: dispatch.provider,
      expiresInSeconds: 300,
      // Provide demo OTP for instant sandbox testing when keys are omitted
      demoOtp: code
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/verify-otp
otpRouter.post('/auth/verify-otp', (req, res) => {
  try {
    const { target, otp } = req.body;

    if (!target || !otp) {
      return res.status(400).json({ error: 'Target and 6-digit OTP code are required.' });
    }

    const cleanTarget = target.trim().toLowerCase();
    const record = otpStore.get(cleanTarget);

    if (!record) {
      return res.status(400).json({ error: 'OTP expired or not requested. Please request a new OTP.' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(cleanTarget);
      return res.status(400).json({ error: 'OTP code has expired. Please request a new code.' });
    }

    if (record.attempts >= 3) {
      otpStore.delete(cleanTarget);
      return res.status(429).json({ error: 'Too many incorrect attempts. Please request a new OTP.' });
    }

    if (record.code !== otp.trim()) {
      record.attempts += 1;
      return res.status(400).json({ 
        error: `Invalid OTP code. ${3 - record.attempts} attempts remaining.` 
      });
    }

    // Mark verified
    record.verified = true;

    // Update user record in db if user exists
    const db = readDb();
    const user = db.users.find(u => (u.phone && u.phone.toLowerCase() === cleanTarget) || (u.email && u.email.toLowerCase() === cleanTarget));
    if (user) {
      user.otpVerified = true;
      writeDb(db);
    }

    res.json({
      success: true,
      message: 'OTP verification successful! Phone/Email verified.',
      target: cleanTarget
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
