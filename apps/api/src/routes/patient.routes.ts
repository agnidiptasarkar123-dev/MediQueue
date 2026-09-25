import { Router } from "express";
import {
  bookAppointmentHandler,
  joinQueueHandler,
  getQueueEntryHandler,
  getDepartmentQueueHandler,
  getPatientAppointmentsHandler,
  getQrHandler,
  getNotificationsHandler,
} from "../controllers/queue.controller";
import { authenticate, requireRole } from "../middleware/auth.middleware";

const router = Router();

// Appointments
router.post("/appointments/book", authenticate, requireRole("PATIENT"), bookAppointmentHandler);
router.get("/appointments", authenticate, requireRole("PATIENT"), getPatientAppointmentsHandler);

// Queue
router.post("/queue/join", authenticate, requireRole("PATIENT"), joinQueueHandler);
router.get("/queue/:id", authenticate, getQueueEntryHandler);
router.get("/queue/department/:departmentId", authenticate, getDepartmentQueueHandler);

// Tokens & QR
router.get("/tokens/:id/qr", authenticate, getQrHandler);

// Notifications
router.get("/notifications", authenticate, requireRole("PATIENT"), getNotificationsHandler);

export default router;
