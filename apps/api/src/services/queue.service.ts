import { prisma } from "../lib/prisma";
import { PriorityType, QueueEntryStatus } from "@prisma/client";

// Priority score: higher = gets served sooner
const PRIORITY_SCORES: Record<PriorityType, number> = {
  EMERGENCY: 1000,
  PREGNANCY: 500,
  ELDERLY: 300,
  REGULAR: 0,
};

/**
 * Generate a department-prefixed token like "C-024"
 */
export async function generateToken(
  departmentCode: string,
  departmentId: string
): Promise<{ tokenNumber: string; tokenDisplay: string }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Count tokens issued today for this department
  const count = await prisma.queueEntry.count({
    where: {
      departmentId,
      joinedAt: { gte: today, lt: tomorrow },
    },
  });

  const seq = count + 1;
  const tokenNumber = seq.toString().padStart(3, "0");
  const tokenDisplay = `${departmentCode.toUpperCase()}-${tokenNumber}`;

  return { tokenNumber, tokenDisplay };
}

/**
 * Calculate queue position for a given entry (1-indexed, after higher priority entries)
 */
export async function calculatePosition(
  queueEntryId: string,
  departmentId: string,
  staffProfileId: string | null,
  priority: PriorityType,
  joinedAt: Date
): Promise<number> {
  const activeStatuses: QueueEntryStatus[] = ["WAITING", "CALLED"];

  const aheadCount = await prisma.queueEntry.count({
    where: {
      departmentId,
      staffProfileId: staffProfileId ?? undefined,
      status: { in: activeStatuses },
      id: { not: queueEntryId },
      OR: [
        // Higher priority score → ahead
        {
          priorityScore: { gt: PRIORITY_SCORES[priority] },
        },
        // Same priority score → earlier join time → ahead
        {
          priorityScore: PRIORITY_SCORES[priority],
          joinedAt: { lt: joinedAt },
        },
      ],
    },
  });

  return aheadCount + 1; // 1-indexed
}

/**
 * Estimate wait time in minutes using enhanced rule-based prediction
 */
export function estimateWait(
  patientsAhead: number,
  avgServiceMinutes: number,
  activeDoctors: number
): number {
  if (patientsAhead <= 0) return 0;
  // Simple M/D/c approximation: divide by active doctors, floor at 1
  const effectiveDoctors = Math.max(1, activeDoctors);
  return Math.round((patientsAhead * avgServiceMinutes) / effectiveDoctors);
}

/**
 * Get the full queue for a department (or specific doctor), ordered by priority then join time
 */
export async function getDepartmentQueue(
  departmentId: string,
  staffProfileId?: string
) {
  const where = {
    departmentId,
    ...(staffProfileId ? { staffProfileId } : {}),
    status: { in: ["WAITING", "CALLED", "IN_CONSULTATION"] as QueueEntryStatus[] },
  };

  return prisma.queueEntry.findMany({
    where,
    orderBy: [
      { priorityScore: "desc" },
      { joinedAt: "asc" },
    ],
    include: {
      appointment: {
        include: {
          patient: true,
        },
      },
      staffProfile: {
        include: { user: true },
      },
    },
  });
}

/**
 * Get explanation factors for the wait estimate
 */
export async function getWaitExplanation(
  departmentId: string,
  staffProfileId: string | null,
  patientsAhead: number
) {
  const staffProfile = staffProfileId
    ? await prisma.staffProfile.findUnique({ where: { id: staffProfileId } })
    : null;

  const avgService = staffProfile?.avgServiceMinutes ?? 6.0;

  const activeDoctors = await prisma.staffProfile.count({
    where: {
      departmentId,
      isActive: true,
      isDoctor: true,
    },
  });

  const priorityCount = await prisma.queueEntry.count({
    where: {
      departmentId,
      status: { in: ["WAITING"] },
      priority: { in: ["EMERGENCY", "PREGNANCY", "ELDERLY"] },
    },
  });

  return {
    patientsAhead,
    avgServiceMinutes: avgService,
    activeDoctors,
    priorityPatientsAhead: priorityCount,
  };
}

export { PRIORITY_SCORES };
