import { Response } from "express";
import { prisma } from "../lib/prisma";
import { sendSuccess, sendError } from "../utils/response";
import { AuthRequest } from "../middleware/auth.middleware";

// GET /api/admin/overview
export async function getOverviewHandler(req: AuthRequest, res: Response) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const patientsToday = await prisma.queueEntry.count({
      where: { joinedAt: { gte: today, lt: tomorrow } },
    });

    const currentlyWaiting = await prisma.queueEntry.count({
      where: { status: "WAITING" },
    });

    const completedToday = await prisma.queueEntry.findMany({
      where: {
        status: "COMPLETED",
        completedAt: { gte: today, lt: tomorrow },
      },
      include: { serviceRecord: true },
    });

    const avgWait =
      completedToday.length > 0
        ? completedToday.reduce((s, e) => s + (e.serviceRecord?.waitDurationMinutes || 0), 0) /
          completedToday.length
        : 0;

    const avgService =
      completedToday.length > 0
        ? completedToday.reduce(
            (s, e) => s + (e.serviceRecord?.serviceDurationMinutes || 0),
            0
          ) / completedToday.length
        : 0;

    return sendSuccess(res, {
      patientsToday,
      currentlyWaiting,
      completedToday: completedToday.length,
      avgWaitMinutes: Math.round(avgWait * 10) / 10,
      avgServiceMinutes: Math.round(avgService * 10) / 10,
    });
  } catch {
    return sendError(res, "FETCH_FAILED", "Failed to fetch overview", 500);
  }
}

// GET /api/admin/departments
export async function getAdminDepartmentsHandler(req: AuthRequest, res: Response) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const departments = await prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    const enriched = await Promise.all(
      departments.map(async (dept) => {
        const todayEntries = await prisma.queueEntry.findMany({
          where: {
            departmentId: dept.id,
            joinedAt: { gte: today, lt: tomorrow },
          },
          include: { serviceRecord: true },
        });

        const waiting = todayEntries.filter((e) => e.status === "WAITING").length;
        const completed = todayEntries.filter((e) => e.status === "COMPLETED");

        const avgWait =
          completed.length > 0
            ? completed.reduce((s, e) => s + (e.serviceRecord?.waitDurationMinutes || 0), 0) /
              completed.length
            : 0;

        const avgService =
          completed.length > 0
            ? completed.reduce(
                (s, e) => s + (e.serviceRecord?.serviceDurationMinutes || 0),
                0
              ) / completed.length
            : 0;

        const activeDoctors = await prisma.staffProfile.count({
          where: { departmentId: dept.id, isActive: true, isDoctor: true },
        });

        // Simple bottleneck detection
        const recentJoins = await prisma.queueEntry.count({
          where: {
            departmentId: dept.id,
            joinedAt: { gte: new Date(Date.now() - 3600000) },
          },
        });
        const recentCompleted = await prisma.queueEntry.count({
          where: {
            departmentId: dept.id,
            completedAt: { gte: new Date(Date.now() - 3600000) },
          },
        });

        const arrivalRate = recentJoins;
        const serviceRate = recentCompleted;
        const isBottleneck = arrivalRate > serviceRate + 2;

        let load: "Normal" | "High Load" | "Critical" = "Normal";
        if (waiting > 20) load = "Critical";
        else if (waiting > 10) load = "High Load";

        return {
          ...dept,
          patientsToday: todayEntries.length,
          waiting,
          completedToday: completed.length,
          avgWaitMinutes: Math.round(avgWait * 10) / 10,
          avgServiceMinutes: Math.round(avgService * 10) / 10,
          activeDoctors,
          load,
          isBottleneck,
          arrivalRatePerHour: arrivalRate,
          serviceRatePerHour: serviceRate,
        };
      })
    );

    return sendSuccess(res, enriched);
  } catch {
    return sendError(res, "FETCH_FAILED", "Failed to fetch admin departments", 500);
  }
}

// GET /api/admin/analytics
export async function getAnalyticsHandler(req: AuthRequest, res: Response) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Queue length by hour (last 8 hours)
    const hourlyData = [];
    for (let h = 0; h < 8; h++) {
      const from = new Date(today.getTime() + h * 3600000);
      const to = new Date(from.getTime() + 3600000);
      const count = await prisma.queueEntry.count({
        where: { joinedAt: { gte: from, lt: to } },
      });
      hourlyData.push({
        hour: `${from.getHours().toString().padStart(2, "0")}:00`,
        patients: count,
      });
    }

    // Department comparison
    const departments = await prisma.department.findMany({ where: { isActive: true } });
    const deptStats = await Promise.all(
      departments.map(async (dept) => {
        const count = await prisma.queueEntry.count({
          where: {
            departmentId: dept.id,
            joinedAt: { gte: today },
          },
        });
        return { name: dept.name, patients: count };
      })
    );

    return sendSuccess(res, {
      hourlyQueueLength: hourlyData,
      departmentComparison: deptStats,
    });
  } catch {
    return sendError(res, "FETCH_FAILED", "Failed to fetch analytics", 500);
  }
}

// GET /api/admin/bottlenecks
export async function getBottlenecksHandler(req: AuthRequest, res: Response) {
  try {
    const departments = await prisma.department.findMany({ where: { isActive: true } });

    const bottlenecks = await Promise.all(
      departments.map(async (dept) => {
        const recentJoins = await prisma.queueEntry.count({
          where: {
            departmentId: dept.id,
            joinedAt: { gte: new Date(Date.now() - 3600000) },
          },
        });
        const recentCompleted = await prisma.queueEntry.count({
          where: {
            departmentId: dept.id,
            completedAt: { gte: new Date(Date.now() - 3600000) },
          },
        });

        const currentWaiting = await prisma.queueEntry.count({
          where: { departmentId: dept.id, status: "WAITING" },
        });

        const isBottleneck = recentJoins > recentCompleted + 2;

        return {
          departmentId: dept.id,
          departmentName: dept.name,
          arrivalRatePerHour: recentJoins,
          serviceRatePerHour: recentCompleted,
          currentWaiting,
          isBottleneck,
          severity: isBottleneck
            ? currentWaiting > 15
              ? "CRITICAL"
              : "WARNING"
            : "NORMAL",
          recommendation: isBottleneck
            ? `Arrival rate (${recentJoins}/hr) exceeds service rate (${recentCompleted}/hr). Consider assigning additional doctors during this period.`
            : null,
        };
      })
    );

    return sendSuccess(res, bottlenecks.filter((b) => b.isBottleneck));
  } catch {
    return sendError(res, "FETCH_FAILED", "Failed to fetch bottlenecks", 500);
  }
}

// POST /api/admin/simulate
export async function simulateQueueHandler(req: AuthRequest, res: Response) {
  try {
    const { departmentId, doctorsCount, arrivalRateMultiplier, avgConsultationMinutes } = req.body;

    const currentWaiting = await prisma.queueEntry.count({
      where: { departmentId, status: "WAITING" },
    });

    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    const currentDoctors = await prisma.staffProfile.count({
      where: { departmentId, isActive: true, isDoctor: true },
    });

    const currentAvgService = await prisma.staffProfile.aggregate({
      where: { departmentId, isActive: true, isDoctor: true },
      _avg: { avgServiceMinutes: true },
    });

    const currentAvg = currentAvgService._avg.avgServiceMinutes || 6;
    const simDoctors = doctorsCount || currentDoctors;
    const simAvgService = avgConsultationMinutes || currentAvg;

    const currentWaitAvg = Math.round((currentWaiting * currentAvg) / Math.max(1, currentDoctors));
    const simWaitAvg = Math.round((currentWaiting * simAvgService) / Math.max(1, simDoctors));

    return sendSuccess(res, {
      departmentName: dept?.name,
      current: {
        doctors: currentDoctors,
        avgWaitMinutes: currentWaitAvg,
        patientsWaiting: currentWaiting,
        avgServiceMinutes: currentAvg,
      },
      simulated: {
        doctors: simDoctors,
        avgWaitMinutes: simWaitAvg,
        patientsWaiting: currentWaiting,
        avgServiceMinutes: simAvgService,
      },
      reduction: currentWaitAvg - simWaitAvg,
      note: "This is a simulation estimate, not a guaranteed result.",
    });
  } catch {
    return sendError(res, "SIMULATION_FAILED", "Simulation failed", 500);
  }
}

// GET /api/admin/audit-logs
export async function getAuditLogsHandler(req: AuthRequest, res: Response) {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 100,
      include: { actor: { select: { phone: true, role: true, name: true } } },
    });
    return sendSuccess(res, logs);
  } catch {
    return sendError(res, "FETCH_FAILED", "Failed to fetch audit logs", 500);
  }
}

// POST /api/admin/departments
export async function createDepartmentHandler(req: AuthRequest, res: Response) {
  try {
    const { name, code, description } = req.body;
    if (!name || !code) return sendError(res, "MISSING_FIELDS", "Name and code are required", 400);

    const dept = await prisma.department.create({
      data: { name, code: code.toUpperCase(), description },
    });
    return sendSuccess(res, { department: dept }, "Department created", 201);
  } catch {
    return sendError(res, "CREATE_FAILED", "Failed to create department", 500);
  }
}

// POST /api/admin/doctors
export async function createDoctorHandler(req: AuthRequest, res: Response) {
  try {
    const { fullName, phone, departmentId, specialization, roomNumber } = req.body;
    if (!fullName || !phone || !departmentId) {
      return sendError(res, "MISSING_FIELDS", "Name, phone, and department are required", 400);
    }

    const { normalizeIndianPhone } = await import("../utils/phone");
    const normalizedPhone = normalizeIndianPhone(phone);

    let user = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
    if (!user) {
      user = await prisma.user.create({
        data: { phone: normalizedPhone, role: "STAFF", name: fullName, isVerified: true },
      });
    }

    const staffProfile = await prisma.staffProfile.create({
      data: {
        userId: user.id,
        fullName,
        departmentId,
        specialization,
        roomNumber,
        isDoctor: true,
      },
    });

    return sendSuccess(res, { staffProfile }, "Doctor created", 201);
  } catch {
    return sendError(res, "CREATE_FAILED", "Failed to create doctor", 500);
  }
}
