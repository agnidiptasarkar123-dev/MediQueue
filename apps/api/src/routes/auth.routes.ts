import { Router } from "express";
import rateLimit from "express-rate-limit";
import { sendOtpHandler, verifyOtpHandler, setupProfileHandler, getMeHandler } from "../controllers/auth.controller";
import { authenticate, requireRole } from "../middleware/auth.middleware";

const router = Router();

const otpSendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many OTP requests. Please try again in 10 minutes." } },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many verification attempts. Please try again later." } },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/send-otp", otpSendLimiter, sendOtpHandler);
router.post("/verify-otp", otpVerifyLimiter, verifyOtpHandler);
router.post("/setup-profile", authenticate, requireRole("PATIENT"), setupProfileHandler);
router.get("/me", authenticate, getMeHandler);

export default router;
