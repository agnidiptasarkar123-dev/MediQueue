# MediQueue Requirements Traceability

This document maps the official CodeVoyage HT-01 requirements to their actual implementation in the MediQueue repository.

| ID | Requirement | Implementation | API | UI | DB | Tests | Status | Evidence |
|----|-------------|----------------|-----|----|----|-------|--------|----------|
| **M1** | Mobile + OTP Registration | Users log in via a 10-digit mobile number and receive a secure 6-digit OTP. Unregistered patients are automatically created. | `POST /api/auth/send-otp`, `POST /api/auth/verify-otp` | `apps/web/app/auth/page.tsx` | `User`, `OtpVerification` models | E2E, Auth Unit | **DONE** | OTP is hashed with bcrypt, expiry enforced. Demo OTP is accessible but never shown in UI in production. |
| **M2** | Digital Token + QR | Patients book appointments and join live queues. They receive a 3-digit token (e.g., C-011) and a secure QR code. | `POST /api/queue/join` | `apps/web/app/patient/queue/page.tsx` | `QueueEntry`, `Appointment` models | E2E | **DONE** | QR contains opaque `MEDIQUEUE|TOKEN|id|tokenDisplay`, preserving privacy. |
| **M3** | Live position + Wait time | Patients see real-time updates of their queue position and estimated wait time without refreshing. | `GET /api/queue/:id` | `apps/web/app/patient/queue/page.tsx` | `QueueEntry.estimatedWaitMinutes` | Socket | **DONE** | Socket.IO broadcasts `queue:updated` on every state change. |
| **M4** | Staff/Doctor Actions | Staff can Call, Skip, Mark No-show, Start, and Complete consultations. | `PUT /api/staff/queue/:id/status` | `apps/web/app/staff/page.tsx` | `QueueEntry.status`, `ServiceRecord` | E2E | **DONE** | State machine enforces valid transitions (e.g. WAITING -> CALLED -> IN_CONSULTATION). |
| **M5** | Admin Analytics | Admin sees total patients, average wait, and department load via interactive charts. | `GET /api/admin/stats` | `apps/web/app/admin/page.tsx` | `AuditLog`, `ServiceRecord` | E2E | **DONE** | Recharts visualizes historical and live data based on actual backend aggregates. |
| **M6** | 3-Turns-Away Notification | When a patient is 3 turns away from being called, a notification is dispatched. | `staff.controller.ts` | `apps/web/components/Notifications.tsx` (or equivalent) | `Notification` model | E2E | **DONE** | Backend checks `patientsAhead === 3` and emits `patient:three-away` via Socket.IO. |
| **B1** | Wait-time prediction model | Recommends an ML model for wait times. | `queue.controller.ts` | Patient Dashboard | `QueueEntry.estimatedWaitMinutes` | Unit | **PARTIAL** | Currently implemented as a robust rule-based heuristic baseline (active doctors, avg service time, queue length). No separate FastAPI model is deployed to maintain architectural stability. |
| **B2** | Walk-in Kiosk | Touch-friendly UI for walk-in patients to register without smartphones. | `POST /api/queue/join` | `apps/web/app/kiosk/page.tsx` | `QueueEntry` | E2E | **DONE** | Self-contained flow accessible at `/kiosk`. |
| **B3** | Priority Queue Handling | High-priority patients (Emergency, Pregnancy, Elderly) skip standard queues. | `queue.controller.ts`, `seed.ts` | `apps/web/app/staff/page.tsx` | `PriorityType` enum | Unit | **DONE** | Priority score calculates insertion index. Staff UI renders distinct badges. |

## Additional Implementation Evidence

- **Persistent Sessions:** Same mobile number loads the same account, history, and active queue position seamlessly.
- **Security:** JWT enforced on all API endpoints. Patients cannot access other patients' data. Staff only manage their own departments.
- **Accessibility:** Entire platform is operable via Keyboard (Tab, Enter, Space). Contrast meets modern WCAG standards.
- **Responsive:** Mobile-first Patient UI, tablet/desktop optimized Staff and Admin UI.
- **Internationalization (i18n):** DONE - Full architecture and contextual strings implemented for 22 Indian languages including persisted selection and RTL bindings for Urdu.
