import { Response } from "express";
import { prisma } from "../lib/prisma";
import {
  generateToken,
  calculatePosition,
  estimateWait,
  getDepartmentQueue,
  getWaitExplanation,
  PRIORITY_SCORES,
} from "../services/queue.service";
import { createNotification } from "../services/notification.service";
import { sendSuccess, sendError } from "../utils/response";
import { AuthRequest } from "../middleware/auth.middleware";
import { paramStr } from "../utils/params";
import { getIO } from "../socket/io";
import QRCode from "qrcode";

// POST /api/appointments/book
export async function bookAppointmentHandler(req: AuthRequest, res: Response) {
  try {
    const { departmentId, staffProfileId, appointmentDate, slotStart, slotEnd } = req.body;

    if (!departmentId || !appointmentDate) {
      return sendError(res, "MISSING_FIELDS", "Department and date are required", 400);
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: req.user!.userId },
    });
    if (!patient) return sendError(res, "NOT_FOUND", "Patient profile not found", 404);

    const department = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!department) return sendError(res, "NOT_FOUND", "Department not found", 404);

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        departmentId,
        staffProfileId: staffProfileId || null,
        appointmentDate: new Date(appointmentDate),
        slotStart: slotStart ? new Date(slotStart) : null,
        slotEnd: slotEnd ? new Date(slotEnd) : null,
        status: "BOOKED",
      },
    });

    return sendSuccess(res, { appointment }, "Appointment booked successfully", 201);
  } catch {
    return sendError(res, "BOOKING_FAILED", "Failed to book appointment", 500);
  }
}

// POST /api/queue/join
export async function joinQueueHandler(req: AuthRequest, res: Response) {
  try {
    const { departmentId, staffProfileId, isWalkIn } = req.body;

    if (!departmentId) {
      return sendError(res, "MISSING_FIELDS", "Department is required", 400);
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: req.user!.userId },
    });
    if (!patient) return sendError(res, "NOT_FOUND", "Patient profile not found", 404);

    const department = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!department) return sendError(res, "NOT_FOUND", "Department not found", 404);

    // Check if already in queue for this department today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingEntry = await prisma.queueEntry.findFirst({
      where: {
        departmentId,
        status: { in: ["WAITING", "CALLED", "IN_CONSULTATION"] },
        appointment: { patientId: patient.id },
        joinedAt: { gte: today, lt: tomorrow },
      },
    });

    if (existingEntry) {
      return sendError(res, "ALREADY_IN_QUEUE", "You are already in the queue for this department today", 409);
    }

    // Create or use existing appointment
    let appointment = await prisma.appointment.findFirst({
      where: {
        patientId: patient.id,
        departmentId,
        status: "BOOKED",
        appointmentDate: { gte: today, lt: tomorrow },
      },
    });

    if (!appointment) {
      appointment = await prisma.appointment.create({
        data: {
          patientId: patient.id,
          departmentId,
          staffProfileId: staffProfileId || null,
          appointmentDate: new Date(),
          status: "WAITING",
          isWalkIn: isWalkIn || false,
        },
      });
    } else {
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: "WAITING", staffProfileId: staffProfileId || appointment.staffProfileId },
      });
    }

    // Generate token
    const { tokenNumber, tokenDisplay } = await generateToken(department.code, departmentId);

    // Determine priority
    const priority = patient.priorityStatus;
    const priorityScore = PRIORITY_SCORES[priority];

    const joinedAt = new Date();

    // Create queue entry
    const queueEntry = await prisma.queueEntry.create({
      data: {
        appointmentId: appointment.id,
        departmentId,
        staffProfileId: staffProfileId || null,
        tokenNumber,
        tokenDisplay,
        priority,
        priorityScore,
        status: "WAITING",
        joinedAt,
      },
    });

    // Calculate position and wait
    const position = await calculatePosition(
      queueEntry.id,
      departmentId,
      staffProfileId || null,
      priority,
      joinedAt
    );

    const staffProfile = staffProfileId
      ? await prisma.staffProfile.findUnique({ where: { id: staffProfileId as string } })
      : null;
    const avgService = staffProfile?.avgServiceMinutes || 6;
    const activeDoctors = await prisma.staffProfile.count({
      where: { departmentId, isActive: true, isDoctor: true },
    });
    const patientsAhead = Math.max(0, position - 1);
    const estimatedWaitMinutes = estimateWait(patientsAhead, avgService, activeDoctors);

    // Update entry with estimates
    await prisma.queueEntry.update({
      where: { id: queueEntry.id },
      data: { position, estimatedWaitMinutes },
    });

    // Generate QR code (encodes opaque token ID only)
    const qrData = `MEDIQUEUE|TOKEN|${queueEntry.id}|${tokenDisplay}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, { errorCorrectionLevel: "M" });

    // Broadcast queue update
    const io = getIO();
    io.to(`dept:${departmentId}`).emit("queue:updated", {
      departmentId,
      action: "joined",
    });

    return sendSuccess(
      res,
      {
        queueEntryId: queueEntry.id,
        tokenDisplay,
        position,
        patientsAhead,
        estimatedWaitMinutes,
        priority,
        department: { id: department.id, name: department.name, code: department.code },
        qrCodeDataUrl,
      },
      "Joined queue successfully",
      201
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to join queue";
    return sendError(res, "JOIN_FAILED", message, 500);
  }
}

// GET /api/queue/:id
export async function getQueueEntryHandler(req: AuthRequest, res: Response) {
  try {
    const id = paramStr(req.params.id);

    const entry = await prisma.queueEntry.findUnique({
      where: { id },
      include: {
        appointment: {
          include: { patient: { include: { user: true } }, department: true },
        },
        staffProfile: true,
      },
    });

    if (!entry) return sendError(res, "NOT_FOUND", "Queue entry not found", 404);

    // Check ownership (patient can only see own entry)
    if (req.user?.role === "PATIENT") {
      const patient = await prisma.patient.findUnique({
        where: { userId: req.user.userId },
      });
      if (entry.appointment.patientId !== patient?.id) {
        return sendError(res, "FORBIDDEN", "Access denied", 403);
      }
    }

    const position = await calculatePosition(
      entry.id,
      entry.departmentId,
      entry.staffProfileId,
      entry.priority,
      entry.joinedAt
    );
    const patientsAhead = Math.max(0, position - 1);
    const avgService = entry.staffProfile?.avgServiceMinutes || 6;
    const activeDoctors = await prisma.staffProfile.count({
      where: { departmentId: entry.departmentId, isActive: true, isDoctor: true },
    });
    const estimatedWaitMinutes = estimateWait(patientsAhead, avgService, activeDoctors);
    const explanation = await getWaitExplanation(entry.departmentId, entry.staffProfileId, patientsAhead);

    return sendSuccess(res, {
      ...entry,
      position,
      patientsAhead,
      estimatedWaitMinutes,
      explanation,
    });
  } catch {
    return sendError(res, "FETCH_FAILED", "Failed to fetch queue entry", 500);
  }
}

// GET /api/queue/department/:departmentId
export async function getDepartmentQueueHandler(req: AuthRequest, res: Response) {
  try {
    const departmentId = paramStr(req.params.departmentId);
    const staffProfileId = req.query.staffProfileId ? paramStr(req.query.staffProfileId as any) : undefined;

    const queue = await getDepartmentQueue(departmentId, staffProfileId);

    return sendSuccess(res, queue);
  } catch {
    return sendError(res, "FETCH_FAILED", "Failed to fetch department queue", 500);
  }
}

// GET /api/appointments (patient's own)
export async function getPatientAppointmentsHandler(req: AuthRequest, res: Response) {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user!.userId } });
    if (!patient) return sendError(res, "NOT_FOUND", "Patient not found", 404);

    const appointments = await prisma.appointment.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: "desc" },
      include: {
        department: true,
        queueEntry: true,
      },
    });

    return sendSuccess(res, appointments);
  } catch {
    return sendError(res, "FETCH_FAILED", "Failed to fetch appointments", 500);
  }
}

// GET /api/tokens/:id/qr
export async function getQrHandler(req: AuthRequest, res: Response) {
  try {
    const id = paramStr(req.params.id);

    const entry = await prisma.queueEntry.findUnique({
      where: { id },
      include: { appointment: { include: { patient: true } } },
    });
    if (!entry) return sendError(res, "NOT_FOUND", "Token not found", 404);

    // Ownership check
    if (req.user?.role === "PATIENT") {
      const patient = await prisma.patient.findUnique({ where: { userId: req.user.userId } });
      if (entry.appointment.patientId !== patient?.id) {
        return sendError(res, "FORBIDDEN", "Access denied", 403);
      }
    }

    const qrData = `MEDIQUEUE|TOKEN|${entry.id}|${entry.tokenDisplay}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, { errorCorrectionLevel: "M" });

    return sendSuccess(res, { qrCodeDataUrl, tokenDisplay: entry.tokenDisplay });
  } catch {
    return sendError(res, "QR_FAILED", "Failed to generate QR code", 500);
  }
}

// GET /api/notifications
export async function getNotificationsHandler(req: AuthRequest, res: Response) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, isRead: false },
      data: { isRead: true },
    });

    return sendSuccess(res, notifications);
  } catch {
    return sendError(res, "FETCH_FAILED", "Failed to fetch notifications", 500);
  }
}
