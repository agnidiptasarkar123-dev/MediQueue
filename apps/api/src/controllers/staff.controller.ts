import { Response } from "express";
import { prisma } from "../lib/prisma";
import { sendSuccess, sendError } from "../utils/response";
import { AuthRequest } from "../middleware/auth.middleware";
import { createNotification } from "../services/notification.service";
import { getIO } from "../socket/io";
import { paramStr } from "../utils/params";

async function broadcastQueueUpdate(departmentId: string, staffProfileId: string | null) {
  const io = getIO();
  io.to(`dept:${departmentId}`).emit("queue:updated", { departmentId, staffProfileId });
  if (staffProfileId) {
    io.to(`staff:${staffProfileId}`).emit("queue:updated", { departmentId, staffProfileId });
  }
}

async function checkAndSendThreeTurnAlert(departmentId: string, staffProfileId: string | null) {
  const waiting = await prisma.queueEntry.findMany({
    where: {
      departmentId,
      ...(staffProfileId ? { staffProfileId } : {}),
      status: "WAITING",
      notificationSent: false,
    },
    orderBy: [{ priorityScore: "desc" }, { joinedAt: "asc" }],
    include: { appointment: { include: { patient: { include: { user: true } } } } },
  });

  for (let i = 0; i < waiting.length; i++) {
    const patientsAhead = i; // 0-indexed
    if (patientsAhead === 3) {
      const entry = waiting[i];
      const userId = entry.appointment.patient.userId;

      await prisma.queueEntry.update({
        where: { id: entry.id },
        data: { notificationSent: true },
      });

      await createNotification(
        userId,
        "THREE_TURNS_AWAY",
        "3 Turns Away",
        `You are now 3 patients away from consultation. Please proceed to the waiting area near the consultation room.`,
        entry.appointmentId
      );

      const io = getIO();
      io.to(`patient:${userId}`).emit("patient:three-away", {
        queueEntryId: entry.id,
        tokenDisplay: entry.tokenDisplay,
        patientsAhead: 3,
      });
    }
  }
}

// GET /api/staff/queue
export async function getStaffQueueHandler(req: AuthRequest, res: Response) {
  try {
    const staffProfile = await prisma.staffProfile.findUnique({
      where: { userId: req.user!.userId },
      include: { department: true },
    });

    if (!staffProfile) return sendError(res, "NOT_FOUND", "Staff profile not found", 404);

    const departmentId = staffProfile.departmentId!;

    const queue = await prisma.queueEntry.findMany({
      where: {
        departmentId,
        status: { in: ["WAITING", "CALLED", "IN_CONSULTATION"] },
      },
      orderBy: [{ priorityScore: "desc" }, { joinedAt: "asc" }],
      include: {
        appointment: {
          include: {
            patient: { include: { user: true } },
            department: true,
          },
        },
      },
    });

    const stats = {
      waiting: queue.filter((e) => e.status === "WAITING").length,
      inConsultation: queue.filter((e) => e.status === "IN_CONSULTATION").length,
      called: queue.filter((e) => e.status === "CALLED").length,
      completedToday: await prisma.queueEntry.count({
        where: {
          departmentId,
          status: "COMPLETED",
          completedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      avgServiceMinutes: staffProfile.avgServiceMinutes,
    };

    return sendSuccess(res, { queue, stats, staffProfile });
  } catch {
    return sendError(res, "FETCH_FAILED", "Failed to fetch staff queue", 500);
  }
}

// POST /api/staff/queue/:id/call
export async function callPatientHandler(req: AuthRequest, res: Response) {
  try {
    const id = paramStr(req.params.id);

    const entry = await prisma.queueEntry.findUnique({
      where: { id },
      include: {
        appointment: { include: { patient: { include: { user: true } } } },
        staffProfile: true,
      },
    });

    if (!entry) return sendError(res, "NOT_FOUND", "Queue entry not found", 404);
    if (entry.status !== "WAITING") {
      return sendError(res, "INVALID_STATE", `Cannot call patient in ${entry.status} status`, 409);
    }

    const updated = await prisma.queueEntry.update({
      where: { id },
      data: { status: "CALLED", calledAt: new Date() },
    });

    await prisma.appointment.update({
      where: { id: entry.appointmentId },
      data: { status: "CALLED" },
    });

    const roomNumber = entry.staffProfile?.roomNumber || "the consultation area";
    const userId = entry.appointment.patient.userId;

    await createNotification(
      userId,
      "YOUR_TURN",
      "Your Turn!",
      `Please proceed to ${roomNumber}. Your token ${entry.tokenDisplay} has been called.`,
      entry.appointmentId
    );

    const io = getIO();
    io.to(`patient:${userId}`).emit("patient:called", {
      queueEntryId: id,
      tokenDisplay: entry.tokenDisplay,
      roomNumber,
    });

    await broadcastQueueUpdate(entry.departmentId, entry.staffProfileId);
    await checkAndSendThreeTurnAlert(entry.departmentId, entry.staffProfileId);

    return sendSuccess(res, { entry: updated }, "Patient called successfully");
  } catch {
    return sendError(res, "ACTION_FAILED", "Failed to call patient", 500);
  }
}

// POST /api/staff/queue/:id/skip
export async function skipPatientHandler(req: AuthRequest, res: Response) {
  try {
    const id = paramStr(req.params.id);
    const { reason } = req.body;

    const entry = await prisma.queueEntry.findUnique({ where: { id } });
    if (!entry) return sendError(res, "NOT_FOUND", "Queue entry not found", 404);
    if (!["WAITING", "CALLED"].includes(entry.status)) {
      return sendError(res, "INVALID_STATE", "Cannot skip patient in current status", 409);
    }

    await prisma.queueEntry.update({
      where: { id },
      data: { status: "SKIPPED" },
    });

    await prisma.appointment.update({
      where: { id: entry.appointmentId },
      data: { status: "SKIPPED" },
    });

    const io = getIO();
    io.to(`dept:${entry.departmentId}`).emit("queue:skipped", { queueEntryId: id, reason });

    await broadcastQueueUpdate(entry.departmentId, entry.staffProfileId);
    await checkAndSendThreeTurnAlert(entry.departmentId, entry.staffProfileId);

    return sendSuccess(res, {}, "Patient skipped");
  } catch {
    return sendError(res, "ACTION_FAILED", "Failed to skip patient", 500);
  }
}

// POST /api/staff/queue/:id/no-show
export async function noShowHandler(req: AuthRequest, res: Response) {
  try {
    const id = paramStr(req.params.id);

    const entry = await prisma.queueEntry.findUnique({ where: { id } });
    if (!entry) return sendError(res, "NOT_FOUND", "Queue entry not found", 404);
    if (!["WAITING", "CALLED"].includes(entry.status)) {
      return sendError(res, "INVALID_STATE", "Cannot mark no-show in current status", 409);
    }

    await prisma.queueEntry.update({
      where: { id },
      data: { status: "NO_SHOW" },
    });

    await prisma.appointment.update({
      where: { id: entry.appointmentId },
      data: { status: "NO_SHOW" },
    });

    const io = getIO();
    io.to(`dept:${entry.departmentId}`).emit("queue:no-show", { queueEntryId: id });

    await broadcastQueueUpdate(entry.departmentId, entry.staffProfileId);
    await checkAndSendThreeTurnAlert(entry.departmentId, entry.staffProfileId);

    return sendSuccess(res, {}, "Marked as no-show");
  } catch {
    return sendError(res, "ACTION_FAILED", "Failed to mark no-show", 500);
  }
}

// POST /api/staff/queue/:id/start
export async function startConsultationHandler(req: AuthRequest, res: Response) {
  try {
    const id = paramStr(req.params.id);

    const entry = await prisma.queueEntry.findUnique({ where: { id } });
    if (!entry) return sendError(res, "NOT_FOUND", "Queue entry not found", 404);
    if (entry.status !== "CALLED") {
      return sendError(res, "INVALID_STATE", "Patient must be called first", 409);
    }

    const now = new Date();
    await prisma.queueEntry.update({
      where: { id },
      data: { status: "IN_CONSULTATION", consultationStartedAt: now },
    });

    await prisma.appointment.update({
      where: { id: entry.appointmentId },
      data: { status: "IN_CONSULTATION" },
    });

    await prisma.serviceRecord.create({
      data: {
        queueEntryId: id,
        consultationStart: now,
      },
    });

    await broadcastQueueUpdate(entry.departmentId, entry.staffProfileId);

    return sendSuccess(res, {}, "Consultation started");
  } catch {
    return sendError(res, "ACTION_FAILED", "Failed to start consultation", 500);
  }
}

// POST /api/staff/queue/:id/complete
export async function completeConsultationHandler(req: AuthRequest, res: Response) {
  try {
    const id = paramStr(req.params.id);

    const entry = await prisma.queueEntry.findUnique({ where: { id } });
    if (!entry) return sendError(res, "NOT_FOUND", "Queue entry not found", 404);
    if (entry.status !== "IN_CONSULTATION") {
      return sendError(res, "INVALID_STATE", "Consultation not started", 409);
    }

    const now = new Date();
    await prisma.queueEntry.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: now },
    });

    await prisma.appointment.update({
      where: { id: entry.appointmentId },
      data: { status: "COMPLETED" },
    });

    const serviceRecord = await prisma.serviceRecord.findUnique({ where: { queueEntryId: id } });
    if (serviceRecord) {
      const durationMinutes =
        (now.getTime() - serviceRecord.consultationStart.getTime()) / 60000;
      const waitMinutes = entry.calledAt
        ? (entry.calledAt.getTime() - entry.joinedAt.getTime()) / 60000
        : null;

      await prisma.serviceRecord.update({
        where: { queueEntryId: id },
        data: {
          consultationEnd: now,
          serviceDurationMinutes: durationMinutes,
          waitDurationMinutes: waitMinutes,
        },
      });

      // Update doctor's rolling average service time
      if (entry.staffProfileId) {
        const recentRecords = await prisma.serviceRecord.findMany({
          where: {
            queueEntry: { staffProfileId: entry.staffProfileId },
            serviceDurationMinutes: { not: null },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        });

        if (recentRecords.length > 0) {
          const avg =
            recentRecords.reduce((s, r) => s + (r.serviceDurationMinutes || 0), 0) /
            recentRecords.length;
          await prisma.staffProfile.update({
            where: { id: entry.staffProfileId },
            data: { avgServiceMinutes: parseFloat(avg.toFixed(2)) },
          });
        }
      }
    }

    await broadcastQueueUpdate(entry.departmentId, entry.staffProfileId);
    await checkAndSendThreeTurnAlert(entry.departmentId, entry.staffProfileId);

    return sendSuccess(res, {}, "Consultation completed");
  } catch {
    return sendError(res, "ACTION_FAILED", "Failed to complete consultation", 500);
  }
}
