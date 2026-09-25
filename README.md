# MediQueue — Smart OPD Queue & Appointment System

**CodeVoyage HT-01**

> **MediQueue** turns hospital waiting into a predictable, real-time experience by connecting patients, doctors, staff and administrators through one intelligent OPD queue system.

---

## 🎯 The Problem

A hospital OPD normally has three disconnected problems:
1. Patients don’t know when their turn will come and waste hours in crowded waiting rooms.
2. Staff don’t have a real-time view of queues, prioritizing patients, and department load.
3. Administrators cannot easily identify bottlenecks or optimize patient flow.

## 💡 The Solution

MediQueue connects all three stakeholders in real time:
**Patient → Queue → Staff → Consultation → Analytics**

The system provides:
- Live appointment booking & walk-in kiosk support
- Real-time queue joining with a secure digital token and QR Code
- Estimated waiting times using dynamic heuristics
- 3-turn-away push notifications
- Seamless staff queue management (Call, Skip, No-Show, Complete)
- Admin analytics and bottleneck detection dashboards
- Full priority queue handling (Emergency, Pregnancy, Elderly)

---

## 🚀 Target Users & Workflows

### 📱 Patient Workflow
1. Log in securely via mobile OTP.
2. View nearby facilities and active departments.
3. Book an appointment or join a live queue.
4. Receive a token (e.g., C-011) and track position live.
5. Get notified when 3 turns away.

### 👩‍⚕️ Staff/Doctor Workflow
1. Log in to the clinical dashboard.
2. View patients sorted dynamically by priority and arrival time.
3. Call the next patient, skip if missing, or start/complete consultations.

### 📊 Admin Workflow
1. Access comprehensive analytics dashboards.
2. Monitor hospital-wide queue lengths, wait times, and department loads.
3. Run "What-If" queue simulations and detect operational bottlenecks.

### 🖥️ Kiosk Workflow
1. Walk-in patients enter their mobile number on a large, high-contrast touch interface.
2. Select department and doctor.
3. Receive queue token and wait-time estimate instantly without needing a smartphone app.

---

## ⚙️ Features & Compliance (HT-01)

### Mandatory Features
- [x] **M1:** Mobile + OTP registration (Strict 10-digit validation + bcrypt).
- [x] **M2:** Appointment/live queue + digital token + QR Code.
- [x] **M3:** Live queue position + real-time estimated waiting time.
- [x] **M4:** Staff/doctor actions (Call next, skip, no-show, complete).
- [x] **M5:** Admin analytics (Queue length, avg wait, patient load).
- [x] **M6:** Push notification at exactly 3 turns away.

### Bonus Features
- [x] **B1:** Wait-time estimation algorithm (Currently implemented as a robust rule-based model calculating active doctors, queue length, and historical averages).
- [x] **B2:** Walk-in Touch Kiosk for offline/on-premise patients.
- [x] **B3:** Advanced Priority handling (Elderly, Pregnancy, Emergencies bypass regular FIFO dynamically).

### Additional Innovation
- **Persistent Patient Accounts:** Same-mobile logins retrieve entire history and active queues.
- **22 Indian Languages:** MediQueue supports 22 Indian languages: Assamese, Bengali, Bodo, Dogri, Gujarati, Hindi, Kannada, Kashmiri, Konkani, Maithili, Malayalam, Manipuri, Marathi, Nepali, Odia, Punjabi, Sanskrit, Santali, Sindhi, Tamil, Telugu and Urdu. Includes full UI translation, persisted language preference, and RTL support for Urdu.
- **Accessibility & Keyboard Navigation:** Fully operable without a mouse.
- **Premium Healthcare UI:** Polished, trustworthy design system built on Google Stitch principles.
- **Privacy First:** QR codes encode opaque references, never plaintext PHI (Protected Health Information).

---

## 🏗️ Architecture

```text
                           Browser (Next.js)
                                │
               ┌────────────────┼────────────────┐
               │                │                │
         Patient App       Staff Panel    Admin Dashboard & Kiosk
               │                │                │
               └────────────────┼────────────────┘
                                │ (REST & Socket.IO)
                                ▼
                     Node.js + Express + TypeScript
                                │
        ┌──────────────┬────────┴────────┬──────────────┐
        │              │                 │              │
 Authentication   Queue Engine     Notifications    Admin Analytics
        │              │                 │              │
        └──────────────┴────────┬────────┴──────────────┘
                                ▼
                              Prisma
                                ▼
                            PostgreSQL
```

### Technology Stack
- **Frontend:** Next.js 15, React, TypeScript, Tailwind CSS v4, Recharts, Lucide Icons
- **Backend:** Node.js, Express, TypeScript, Zod, Socket.IO, bcrypt
- **Database:** PostgreSQL, Prisma ORM
- **Testing:** Autonomous Playwright/Chrome-based E2E, Unit Tests

---

## 🛠️ Quick Start & Setup

### Prerequisites
- Node.js (v20+)
- PostgreSQL (v14+) running locally or via Docker
- Git

### 1. Clone & Install
```bash
git clone https://github.com/your-org/mediqueue.git
cd mediqueue
npm install
```

### 2. Environment Variables
Copy the example environment files for both apps:
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```
Ensure your `DATABASE_URL` in `apps/api/.env` points to a valid PostgreSQL instance.

### 3. Database Migration & Seed
```bash
cd apps/api
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
```
*Note: The seed script injects 3 departments, 6 doctors, and 45+ synthetic patients into active queues to ensure the demo is populated.*

### 4. Start Development Servers
```bash
# Terminal 1 — Backend API
cd apps/api
npm run dev

# Terminal 2 — Frontend App
cd apps/web
npm run dev
```

### 5. Access the Platform
- **Patient Interface:** `http://localhost:3000`
- **Staff Dashboard:** `http://localhost:3000/staff`
- **Admin Analytics:** `http://localhost:3000/admin`
- **Kiosk Mode:** `http://localhost:3000/kiosk`
- **API Health:** `http://localhost:5001/health`

---

## 🎭 Demo Credentials

> ⚠ **Note:** All data is synthetic and created exclusively for demo purposes. OTPs in the demo environment are randomly generated but visible in the UI prompt for testing convenience.

**Demo Patient:**
- Phone: `+91 9911223344`

**Demo Staff (Doctor):**
- Phone: `+91 8800000001` (Dr. Ananya Sen)

**Demo Admin:**
- Phone: `+91 9999999999`

---

## 📡 API & Socket.IO Reference

### Core API Endpoints
| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|-------------|
| POST | `/api/auth/send-otp` | No | Any | Generates and hashes 6-digit OTP |
| POST | `/api/auth/verify-otp` | No | Any | Validates OTP and returns JWT |
| POST | `/api/queue/join` | Yes | PATIENT | Joins live queue & returns Token |
| PUT | `/api/staff/queue/:id/status` | Yes | STAFF | Updates status (Call, Skip, etc.) |
| GET | `/api/admin/stats` | Yes | ADMIN | Fetches bottleneck & load stats |

### Core Socket Events
| Event | Direction | Scope | Description |
|-------|-----------|-------|-------------|
| `queue:updated` | Server → Client | Dept | Broadcasts queue metric changes |
| `patient:three-away`| Server → Client | User | Push notification sent to specific token |
| `patient:called` | Server → Client | User | Alerts patient to proceed to room |

---

## 🧪 Testing
See [docs/TEST_REPORT.md](docs/TEST_REPORT.md) for full execution results. We maintain tests across Unit, E2E, Auth, RBAC, Queue state logic, and UI accessibility.

---

## 🔒 Security & Privacy
- **JWT & Role-Based Access (RBAC):** Rigid API checks prevent Patients from triggering Staff actions.
- **OTP Hardening:** Never returned in production HTTP payloads; strictly hashed with bcrypt.
- **Privacy-by-Design QR:** Encodes only opaque UUIDs, never plaintext medical or personal history.

---

## 📝 License
Proprietary / Closed Source for CodeVoyage Hackathon Submission. All synthetic names and scenarios are purely illustrative.
