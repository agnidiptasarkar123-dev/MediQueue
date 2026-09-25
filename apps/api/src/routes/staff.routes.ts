import { Router } from "express";
import {
  getStaffQueueHandler,
  callPatientHandler,
  skipPatientHandler,
  noShowHandler,
  startConsultationHandler,
  completeConsultationHandler,
} from "../controllers/staff.controller";
import { authenticate, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate, requireRole("STAFF", "ADMIN"));

router.get("/queue", getStaffQueueHandler);
router.post("/queue/:id/call", callPatientHandler);
router.post("/queue/:id/skip", skipPatientHandler);
router.post("/queue/:id/no-show", noShowHandler);
router.post("/queue/:id/start", startConsultationHandler);
router.post("/queue/:id/complete", completeConsultationHandler);

export default router;
