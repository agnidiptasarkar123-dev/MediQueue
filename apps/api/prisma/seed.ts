/**
 * MediQueue Seed Script
 * Generates synthetic demo data:
 * - 3 departments (Cardiology, General Medicine, Orthopedics)
 * - 6 doctors
 * - 45+ synthetic patients
 * - Active queue entries for live demo
 * - Admin and staff accounts
 *
 * NOTE: All data is synthetic and created for demonstration purposes only.
 */

import { PrismaClient, PriorityType, QueueEntryStatus, AppointmentStatus } from "@prisma/client";
import bcrypt from "bcrypt";
import crypto from "crypto";

const prisma = new PrismaClient();

// ── Synthetic patient names (Indian names for realistic demo) ─────────────────
const PATIENT_NAMES = [
  "Arjun Sharma", "Priya Singh", "Rahul Das", "Anita Roy", "Vikram Patel",
  "Sunita Gupta", "Amit Kumar", "Kavita Nair", "Rajesh Mehta", "Deepa Iyer",
  "Suresh Pillai", "Meera Reddy", "Arun Bose", "Lakshmi Menon", "Kiran Joshi",
  "Pooja Verma", "Sanjay Rao", "Neha Malhotra", "Ravi Krishnan", "Geeta Pandey",
  "Manoj Desai", "Asha Tiwari", "Varun Mishra", "Rekha Agarwal", "Dinesh Saxena",
  "Shweta Yadav", "Naveen Choudhary", "Radha Bhatt", "Sunil Thakur", "Preeti Sharma",
  "Akash Goel", "Divya Chauhan", "Rohit Banerjee", "Smita Ghosh", "Abhinav Sen",
  "Pallavi Mukherjee", "Vivek Srivastava", "Ananya Bhat", "Tarun Kapoor", "Ritu Sethi",
  "Harish Nair", "Padma Krishnamurthy", "Ramesh Venkataraman", "Saranya Rajan", "Girish Kulkarni",
];

// Priority distribution: mostly REGULAR, some ELDERLY, few PREGNANCY/EMERGENCY
const PRIORITY_DISTRIBUTION: PriorityType[] = [
  "REGULAR", "REGULAR", "REGULAR", "REGULAR", "REGULAR",
  "REGULAR", "REGULAR", "ELDERLY", "ELDERLY", "PREGNANCY",
];

function randomPhone(): string {
  const prefix = ["98765", "99876", "91234", "87654", "96543"];
  const p = prefix[Math.floor(Math.random() * prefix.length)];
  const suffix = Math.floor(10000 + Math.random() * 90000).toString();
  return `+91${p}${suffix}`;
}

function randomPriority(): PriorityType {
  return PRIORITY_DISTRIBUTION[Math.floor(Math.random() * PRIORITY_DISTRIBUTION.length)];
}

const PRIORITY_SCORES: Record<PriorityType, number> = {
  EMERGENCY: 1000, PREGNANCY: 500, ELDERLY: 300, REGULAR: 0,
};

async function main() {
  console.log("🌱 Seeding MediQueue database with synthetic demo data...\n");

  // ── Clean existing data ─────────────────────────────────────────────────────
  console.log("Cleaning existing data...");
  await prisma.predictionLog.deleteMany();
  await prisma.serviceRecord.deleteMany();
  await prisma.queueEntry.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.otpVerification.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.staffProfile.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();
  console.log("✓ Cleaned\n");

  // ── Create Departments ─────────────────────────────────────────────────────
  console.log("Creating departments...");
  const cardiology = await prisma.department.create({
    data: { name: "Cardiology", code: "C", description: "Heart and cardiovascular care" },
  });
  const generalMedicine = await prisma.department.create({
    data: { name: "General Medicine", code: "G", description: "General health and primary care" },
  });
  const orthopedics = await prisma.department.create({
    data: { name: "Orthopedics", code: "O", description: "Bone, joint, and muscle care" },
  });
  console.log("✓ 3 departments created\n");

  // ── Create Admin ─────────────────────────────────────────────────────────
  console.log("Creating admin account...");
  const adminUser = await prisma.user.create({
    data: {
      phone: "+919988776611",
      role: "ADMIN",
      name: "Admin",
      isVerified: true,
      isActive: true,
    },
  });
  console.log(`✓ Admin: +91 9988776611\n`);

  // ── Create Doctors ─────────────────────────────────────────────────────────
  console.log("Creating doctors...");
  const doctorData = [
    { name: "Dr. Ananya Sen", phone: "+918800000001", dept: cardiology.id, spec: "MBBS, MD - Cardiology", room: "Room 201", avg: 7.2 },
    { name: "Dr. Rahul Das", phone: "+918800000002", dept: cardiology.id, spec: "MBBS, DM - Cardiology", room: "Room 202", avg: 6.8 },
    { name: "Dr. Arjun Roy", phone: "+918800000003", dept: generalMedicine.id, spec: "MBBS, MD - General Medicine", room: "Room 101", avg: 5.5 },
    { name: "Dr. Priya Sharma", phone: "+918800000004", dept: generalMedicine.id, spec: "MBBS, MD - Internal Medicine", room: "Room 102", avg: 5.1 },
    { name: "Dr. Kabir Sen", phone: "+918800000005", dept: orthopedics.id, spec: "MBBS, MS - Orthopedics", room: "Room 301", avg: 6.2 },
    { name: "Dr. Neha Bose", phone: "+918800000006", dept: orthopedics.id, spec: "MBBS, DNB - Orthopedics", room: "Room 302", avg: 5.8 },
  ];

  const staffProfiles = [];
  for (const d of doctorData) {
    const user = await prisma.user.create({
      data: { phone: d.phone, role: "STAFF", name: d.name, isVerified: true },
    });
    const profile = await prisma.staffProfile.create({
      data: {
        userId: user.id,
        fullName: d.name,
        departmentId: d.dept,
        specialization: d.spec,
        roomNumber: d.room,
        avgServiceMinutes: d.avg,
        isDoctor: true,
        isActive: true,
      },
    });
    staffProfiles.push(profile);
    console.log(`  ✓ ${d.name} → ${d.room}`);
  }
  console.log();

  // ── Helpers ───────────────────────────────────────────────────────────────
  const [drSen, drDas, drRoy, drSharma, drKabir, drNeha] = staffProfiles;

  const deptDoctorMap: Record<string, typeof staffProfiles[0][]> = {
    [cardiology.id]: [drSen, drDas],
    [generalMedicine.id]: [drRoy, drSharma],
    [orthopedics.id]: [drKabir, drNeha],
  };

  const deptList = [
    { dept: cardiology, count: 15 },
    { dept: generalMedicine, count: 15 },
    { dept: orthopedics, count: 15 },
  ];

  // ── Create Patients + Queue Entries ────────────────────────────────────────
  console.log("Creating 45 synthetic patients and queue entries...");
  const today = new Date();
  today.setHours(8, 0, 0, 0);
  let nameIndex = 0;

  for (const { dept, count } of deptList) {
    const doctors = deptDoctorMap[dept.id];
    let tokenSeq = 1;

    for (let i = 0; i < count; i++) {
      const name = PATIENT_NAMES[nameIndex % PATIENT_NAMES.length];
      nameIndex++;

      const phone = randomPhone();
      const priority = randomPriority();
      const priorityScore = PRIORITY_SCORES[priority];

      // Create user
      const user = await prisma.user.create({
        data: { phone, role: "PATIENT", name, isVerified: true },
      });

      // Create patient
      const patient = await prisma.patient.create({
        data: {
          userId: user.id,
          fullName: name,
          priorityStatus: priority,
          consentGiven: true,
        },
      });

      // Alternate between doctors in the department
      const doctor = doctors[i % doctors.length];

      // Join time: spread across the morning (8am to current time)
      const joinedAt = new Date(today.getTime() + i * 8 * 60000);

      // Status: first 5 COMPLETED, next 1 IN_CONSULTATION, next 2 CALLED, rest WAITING
      let status: QueueEntryStatus;
      let apptStatus: AppointmentStatus;
      if (i < 5) { status = "COMPLETED"; apptStatus = "COMPLETED"; }
      else if (i === 5) { status = "IN_CONSULTATION"; apptStatus = "IN_CONSULTATION"; }
      else if (i === 6 || i === 7) { status = "CALLED"; apptStatus = "CALLED"; }
      else { status = "WAITING"; apptStatus = "WAITING"; }

      const tokenDisplay = `${dept.code}-${tokenSeq.toString().padStart(3, "0")}`;
      tokenSeq++;

      const appointment = await prisma.appointment.create({
        data: {
          patientId: patient.id,
          staffProfileId: doctor.id,
          departmentId: dept.id,
          appointmentDate: new Date(),
          status: apptStatus,
        },
      });

      const calledAt = status !== "WAITING" ? new Date(joinedAt.getTime() + 40 * 60000) : null;
      const consultationStartedAt = ["IN_CONSULTATION", "COMPLETED"].includes(status)
        ? new Date((calledAt?.getTime() || 0) + 2 * 60000)
        : null;
      const completedAt = status === "COMPLETED"
        ? new Date((consultationStartedAt?.getTime() || 0) + doctor.avgServiceMinutes * 60000)
        : null;

      // Notification: send for patients 3 turns away from current position
      const notificationSent = i === count - 4; // 3 turns from end

      const queueEntry = await prisma.queueEntry.create({
        data: {
          appointmentId: appointment.id,
          departmentId: dept.id,
          staffProfileId: doctor.id,
          tokenNumber: (tokenSeq - 1).toString().padStart(3, "0"),
          tokenDisplay,
          priority,
          priorityScore,
          status,
          notificationSent,
          position: i + 1,
          estimatedWaitMinutes: Math.max(0, (count - i) * doctor.avgServiceMinutes),
          joinedAt,
          calledAt,
          consultationStartedAt,
          completedAt,
        },
      });

      // Create service records for completed
      if (status === "COMPLETED" && consultationStartedAt && completedAt) {
        const serviceDuration = (completedAt.getTime() - consultationStartedAt.getTime()) / 60000;
        const waitDuration = calledAt
          ? (calledAt.getTime() - joinedAt.getTime()) / 60000
          : null;

        await prisma.serviceRecord.create({
          data: {
            queueEntryId: queueEntry.id,
            consultationStart: consultationStartedAt,
            consultationEnd: completedAt,
            serviceDurationMinutes: serviceDuration,
            waitDurationMinutes: waitDuration,
          },
        });
      }

      // Service record for IN_CONSULTATION
      if (status === "IN_CONSULTATION" && consultationStartedAt) {
        await prisma.serviceRecord.create({
          data: {
            queueEntryId: queueEntry.id,
            consultationStart: consultationStartedAt,
          },
        });
      }
    }

    console.log(`  ✓ ${dept.name}: ${count} patients`);
  }

  // ── Create Demo Patient (Arjun) for the judge demo ────────────────────────
  console.log("\nCreating demo patient (Arjun Sharma)...");
  const demoPhone = "+919911223344";
  const demoUser = await prisma.user.create({
    data: { phone: demoPhone, role: "PATIENT", name: "Arjun Sharma", isVerified: true },
  });
  const demoPatient = await prisma.patient.create({
    data: {
      userId: demoUser.id,
      fullName: "Arjun Sharma",
      priorityStatus: "REGULAR",
      consentGiven: true,
    },
  });

  // Create a pre-OTP record so demo can log in with 123456... but let's store a real hash
  // In demo mode the backend returns the OTP anyway.
  const demoOtpHash = await bcrypt.hash("123456", 12);
  await prisma.otpVerification.create({
    data: {
      userId: demoUser.id,
      phone: demoPhone,
      otpHash: demoOtpHash,
      expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000), // 1 year for demo
      maxAttempts: 100,
    },
  });

  console.log(`✓ Demo patient: +91 9911223344 | Demo OTP: 123456\n`);

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("═══════════════════════════════════════");
  console.log("  🎉 MediQueue seed complete!");
  console.log("═══════════════════════════════════════");
  console.log("  Departments: 3 (Cardiology, Gen. Medicine, Orthopedics)");
  console.log("  Doctors: 6");
  console.log("  Patients: 45 synthetic + 1 demo patient");
  console.log("  Admin: +91 9988776611");
  console.log("  Demo patient: +91 9911223344 | OTP: 123456");
  console.log("═══════════════════════════════════════");
  console.log("\n⚠  DEMO ENVIRONMENT: All data is synthetic.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
