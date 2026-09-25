import { Router } from "express";
import { getDepartmentsHandler, getDepartmentDoctorsHandler } from "../controllers/department.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", getDepartmentsHandler);
router.get("/:id/doctors", authenticate, getDepartmentDoctorsHandler);

export default router;
