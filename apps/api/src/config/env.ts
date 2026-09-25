import dotenv from "dotenv";
dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export const config = {
  port: Number(process.env.PORT) || 5001,
  nodeEnv: process.env.NODE_ENV || "development",
  isDev: process.env.NODE_ENV !== "production",
  demoMode: process.env.DEMO_MODE === "true",

  jwt: {
    secret: requireEnv("JWT_SECRET"),
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },

  otp: {
    mode: (process.env.OTP_MODE || "SIMULATION") as "SIMULATION" | "SMS",
    expiryMinutes: Number(process.env.OTP_EXPIRY_MINUTES) || 5,
    maxAttempts: Number(process.env.OTP_MAX_ATTEMPTS) || 5,
    resendCooldownSeconds: Number(process.env.OTP_RESEND_COOLDOWN_SECONDS) || 30,
  },

  frontend: {
    url: process.env.FRONTEND_URL || "http://localhost:3000",
  },
};
