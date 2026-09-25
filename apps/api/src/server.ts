import "dotenv/config";
import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/env";
import { initializeSocket } from "./socket/io";
import { errorHandler } from "./middleware/error.middleware";

import authRoutes from "./routes/auth.routes";
import departmentRoutes from "./routes/department.routes";
import patientRoutes from "./routes/patient.routes";
import staffRoutes from "./routes/staff.routes";
import adminRoutes from "./routes/admin.routes";

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
initializeSocket(httpServer);

// Security
app.use(helmet());
app.use(
  cors({
    origin: config.frontend.url,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);

// Body parsing
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// Demo environment header
if (config.demoMode) {
  app.use((_, res, next) => {
    res.setHeader(
      "X-Demo-Environment",
      "All patient data is synthetic and created for demonstration purposes only"
    );
    next();
  });
}

// Health check
app.get("/health", (_, res) => {
  res.json({
    success: true,
    service: "MediQueue API",
    version: "1.0.0",
    environment: config.nodeEnv,
    demo: config.demoMode,
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api", patientRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/admin", adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: `Route ${req.method} ${req.path} not found` },
  });
});

// Global error handler
app.use(errorHandler);

// Start server
httpServer.listen(config.port, () => {
  console.log(`
╔═══════════════════════════════════════╗
║      MediQueue API v1.0.0             ║
╠═══════════════════════════════════════╣
║  Port:        ${config.port}                   ║
║  Environment: ${config.nodeEnv.padEnd(24)}║
║  Demo Mode:   ${String(config.demoMode).padEnd(24)}║
║  OTP Mode:    ${config.otp.mode.padEnd(24)}║
╚═══════════════════════════════════════╝
  `);
});

export { app, httpServer };
