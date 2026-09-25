import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { normalizeIndianPhone, maskPhone } from "../utils/phone";
import { generateAndStoreOtp, verifyOtp } from "../services/otp.service";
import { generateAccessToken } from "../services/token.service";
import { config } from "../config/env";
import { sendSuccess, sendError } from "../utils/response";
import { AuthRequest } from "../middleware/auth.middleware";

// POST /api/auth/send-otp
export async function sendOtpHandler(req: Request, res: Response) {
  try {
    const { phone } = req.body;

    if (!phone || typeof phone !== "string") {
      return sendError(res, "INVALID_PHONE", "Mobile number is required", 400);
    }

    let normalizedPhone: string;
    try {
      normalizedPhone = normalizeIndianPhone(phone);
    } catch {
      return sendError(res, "INVALID_PHONE", "Invalid Indian mobile number. Enter a 10-digit number.", 400);
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
    if (!user) {
      user = await prisma.user.create({
        data: { phone: normalizedPhone, role: "PATIENT" },
      });
      await prisma.patient.create({
        data: { userId: user.id, fullName: "Patient" },
      });
    }

    if (!user.isActive) {
      return sendError(res, "ACCOUNT_DISABLED", "Your account has been disabled. Please contact support.", 403);
    }

    const { otp, expiresAt } = await generateAndStoreOtp(user.id, normalizedPhone);

    // Simulation mode: log OTP to console (NEVER in production)
    if (config.otp.mode === "SIMULATION") {
      console.log(`\n[SIMULATED OTP] Phone: ${normalizedPhone} | OTP: ${otp}\n`);
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      data: {
        maskedPhone: maskPhone(phone),
        expiresAt,
        expiresInSeconds: config.otp.expiryMinutes * 60,
        resendCooldownSeconds: config.otp.resendCooldownSeconds,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send OTP";
    return sendError(res, "OTP_SEND_FAILED", message, 400);
  }
}

// POST /api/auth/verify-otp
export async function verifyOtpHandler(req: Request, res: Response) {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return sendError(res, "MISSING_FIELDS", "Phone number and OTP are required", 400);
    }

    let normalizedPhone: string;
    try {
      normalizedPhone = normalizeIndianPhone(phone);
    } catch {
      return sendError(res, "INVALID_PHONE", "Invalid phone number", 400);
    }

    const user = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
    if (!user) {
      return sendError(res, "USER_NOT_FOUND", "User not found. Please request an OTP first.", 404);
    }

    await verifyOtp(user.id, otp.toString().trim());

    // Reload user to get updated isVerified state
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { patient: true },
    });

    const token = generateAccessToken({ userId: user.id, role: user.role });

    return sendSuccess(
      res,
      {
        token,
        user: {
          id: updatedUser!.id,
          phone: updatedUser!.phone,
          role: updatedUser!.role,
          isVerified: updatedUser!.isVerified,
          name: updatedUser!.patient?.fullName || updatedUser!.name,
          needsProfileSetup: !updatedUser!.patient?.fullName || updatedUser!.patient.fullName === "Patient",
        },
      },
      "OTP verified successfully"
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "OTP verification failed";
    return sendError(res, "OTP_VERIFY_FAILED", message, 401);
  }
}

// POST /api/auth/setup-profile
export async function setupProfileHandler(req: AuthRequest, res: Response) {
  try {
    const { fullName, dateOfBirth, gender, consentGiven } = req.body;

    if (!fullName || typeof fullName !== "string") {
      return sendError(res, "INVALID_NAME", "Full name is required", 400);
    }

    if (!consentGiven) {
      return sendError(res, "CONSENT_REQUIRED", "Consent is required to use MediQueue", 400);
    }

    const patient = await prisma.patient.update({
      where: { userId: req.user!.userId },
      data: {
        fullName: fullName.trim(),
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender: gender || undefined,
        consentGiven: true,
      },
    });

    // Also update user name
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { name: fullName.trim() },
    });

    return sendSuccess(res, { patient }, "Profile updated successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Profile setup failed";
    return sendError(res, "PROFILE_SETUP_FAILED", message, 400);
  }
}

// GET /api/auth/me
export async function getMeHandler(req: AuthRequest, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { patient: true, staffProfile: { include: { department: true } } },
    });

    if (!user) {
      return sendError(res, "USER_NOT_FOUND", "User not found", 404);
    }

    return sendSuccess(res, {
      id: user.id,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      patient: user.patient,
      staffProfile: user.staffProfile,
    });
  } catch {
    return sendError(res, "FETCH_FAILED", "Failed to fetch user", 500);
  }
}
