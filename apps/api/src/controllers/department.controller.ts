import { Response } from "express";
import { prisma } from "../lib/prisma";
import { sendSuccess, sendError } from "../utils/response";
import { AuthRequest } from "../middleware/auth.middleware";

// GET /api/departments
export async function getDepartmentsHandler(req: AuthRequest, res: Response) {
  try {
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    // Enrich with live queue stats
    const enriched = await Promise.all(
      departments.map(async (dept) => {
        const waitingCount = await prisma.queueEntry.count({
          where: {
            departmentId: dept.id,
            status: { in: ["WAITING", "CALLED"] },
          },
        });

        const avgService = await prisma.staffProfile.aggregate({
          where: { departmentId: dept.id, isActive: true, isDoctor: true },
          _avg: { avgServiceMinutes: true },
        });

        const avgServiceMinutes = avgService._avg.avgServiceMinutes || 6;
        const activeDoctors = await prisma.staffProfile.count({
          where: { departmentId: dept.id, isActive: true, isDoctor: true },
        });
        const effectiveDoctors = Math.max(1, activeDoctors);
        const estimatedWaitMinutes = Math.round(
          (waitingCount * avgServiceMinutes) / effectiveDoctors
        );

        return {
          ...dept,
          waitingCount,
          estimatedWaitMinutes,
          activeDoctors,
        };
      })
    );

    return sendSuccess(res, enriched);
  } catch {
    return sendError(res, "FETCH_FAILED", "Failed to fetch departments", 500);
  }
}

// GET /api/departments/:id/doctors
export async function getDepartmentDoctorsHandler(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;

    const doctors = await prisma.staffProfile.findMany({
      where: { departmentId: id, isActive: true, isDoctor: true },
      include: { user: true },
    });

    const enriched = await Promise.all(
      doctors.map(async (doc) => {
        const waitingCount = await prisma.queueEntry.count({
          where: {
            staffProfileId: doc.id,
            status: { in: ["WAITING", "CALLED"] },
          },
        });

        const estimatedWaitMinutes = Math.round(
          waitingCount * doc.avgServiceMinutes
        );

        const dept = doc.departmentId
          ? await prisma.department.findUnique({ where: { id: doc.departmentId } })
          : null;

        return {
          id: doc.id,
          name: doc.fullName,
          specialization: doc.specialization,
          roomNumber: doc.roomNumber,
          avgServiceMinutes: doc.avgServiceMinutes,
          department: dept?.name || null,
          departmentId: doc.departmentId,
          waitingCount,
          estimatedWaitMinutes,
          isAvailable: doc.isActive,
        };
      })
    );

    return sendSuccess(res, enriched);
  } catch {
    return sendError(res, "FETCH_FAILED", "Failed to fetch doctors", 500);
  }
}
