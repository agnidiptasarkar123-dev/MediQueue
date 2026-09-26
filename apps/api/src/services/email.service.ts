import nodemailer from "nodemailer";

export async function sendEmailOtp(to: string, otp: string) {
  const mode = process.env.EMAIL_MODE || "SIMULATION";
  
  if (mode === "SIMULATION") {
    console.log(`\n[SIMULATED EMAIL OTP] Email: ${to} | OTP: ${otp}\n`);
    return;
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("EMAIL_DELIVERY_NOT_CONFIGURED");
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("[MEDIQUEUE EMAIL] SMTP configured: true");
    try {
      await transporter.verify();
      console.log("[MEDIQUEUE EMAIL] SMTP transporter: verified");
    } catch (e) {
      console.log("[MEDIQUEUE EMAIL] SMTP transporter: failed");
      throw new Error("EMAIL_DELIVERY_NOT_CONFIGURED");
    }
  }

  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || '"MediQueue" <no-reply@mediqueue.com>',
      to,
      subject: "Your MediQueue Verification Code",
      text: `Your MediQueue verification code is: ${otp}\n\nIt expires in 5 minutes.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>MediQueue Verification</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #2563eb; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in 5 minutes.</p>
        </div>
      `,
    });
    if (process.env.NODE_ENV !== "production") {
      console.log(`[MEDIQUEUE EMAIL] Delivery: success | Recipient: ${to.replace(/^(.{2})(.*)(@.*)$/, "$1***$3")}`);
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[MEDIQUEUE EMAIL] Delivery: failed | Recipient: ${to.replace(/^(.{2})(.*)(@.*)$/, "$1***$3")}`);
    }
    throw new Error("Email delivery failed");
  }
}
