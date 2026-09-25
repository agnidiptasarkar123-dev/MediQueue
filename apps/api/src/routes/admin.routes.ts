import { Router } from "express";
import {
  getOverviewHandler,
  getAdminDepartmentsHandler,
  getAnalyticsHandler,
  getBottlenecksHandler,
  simulateQueueHandler,
  getAuditLogsHandler,
  createDepartmentHandler,
  createDoctorHandler,
} from "../controllers/admin.controller";
import { authenticate, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.get("/overview", getOverviewHandler);
router.get("/departments", getAdminDepartmentsHandler);
router.get("/analytics", getAnalyticsHandler);
router.get("/bottlenecks", getBottlenecksHandler);
router.post("/simulate", simulateQueueHandler);
router.get("/audit-logs", getAuditLogsHandler);
router.post("/departments", createDepartmentHandler);
router.post("/doctors", createDoctorHandler);

export default router;
