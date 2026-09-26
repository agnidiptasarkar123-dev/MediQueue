import crypto from "crypto";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import { config } from "../config/env";

const BCRYPT_ROUNDS = 12;

function generateOtp(): string {
  // crypto.randomInt(100000, 1000000) returns [100000, 999999]
  return crypto.randomInt(100000, 1000000).toString();
}

export async function generateAndStoreOtp(userId: string, phone?: string, email?: string) {
  // Check resend cooldown
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.lastSentAt) {
    const cooldownMs = config.otp.resendCooldownSeconds * 1000;
    const elapsed = Date.now() - user.lastSentAt.getTime();
    if (elapsed < cooldownMs) {
      const remaining = Math.ceil((cooldownMs - elapsed) / 1000);
      throw new Error(`Please wait ${remaining} seconds before requesting a new OTP.`);
    }
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000);

  // Invalidate all previous unused OTPs for this user
  await prisma.otpVerification.updateMany({
    where: { userId, verified: false },
    data: { verified: true },
  });

  await prisma.otpVerification.create({
    data: {
      userId,
      phone: phone || null,
      email: email || null,
      otpHash,
      expiresAt,
      maxAttempts: config.otp.maxAttempts,
    },
  });

  // Update lastSentAt for cooldown enforcement
  await prisma.user.update({
    where: { id: userId },
    data: { lastSentAt: new Date() },
  });

  return { otp, expiresAt };
}

export async function verifyOtp(userId: string, otp: string): Promise<boolean> {
  const verification = await prisma.otpVerification.findFirst({
    where: { userId, verified: false },
    orderBy: { createdAt: "desc" },
  });

  if (!verification) {
    throw new Error("No active OTP found. Please request a new one.");
  }

  if (verification.expiresAt < new Date()) {
    throw new Error("OTP has expired. Please request a new one.");
  }

  if (verification.attempts >= verification.maxAttempts) {
    throw new Error("Too many incorrect attempts. Please request a new OTP.");
  }

  // Increment attempt count BEFORE verifying (prevents timing attacks)
  await prisma.otpVerification.update({
    where: { id: verification.id },
    data: { attempts: { increment: 1 } },
  });

  const isValid = await bcrypt.compare(otp, verification.otpHash);

  if (!isValid) {
    const attemptsLeft = verification.maxAttempts - (verification.attempts + 1);
    if (attemptsLeft > 0) {
      throw new Error(`Invalid OTP. ${attemptsLeft} attempt(s) remaining.`);
    } else {
      throw new Error("Invalid OTP. No attempts remaining. Please request a new OTP.");
    }
  }

  // Mark OTP as verified (single-use enforcement)
  await prisma.otpVerification.update({
    where: { id: verification.id },
    data: { verified: true, verifiedAt: new Date() },
  });

  // Mark user as verified
  await prisma.user.update({
    where: { id: userId },
    data: { isVerified: true },
  });

  return true;
}
