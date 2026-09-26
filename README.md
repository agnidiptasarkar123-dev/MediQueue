# MediQueue 🏥

**Smart OPD Queue & Appointment System**
CodeVoyage HT-01

MediQueue transforms hospital waiting into a predictable, transparent, and seamless experience by connecting patients, doctors, staff, and administrators through one intelligent real-time OPD queue system.

---

## 🚀 Features

### Core Capabilities (M1 - M6)
- **Live Queue Tracking:** Join queues remotely and track exact position in real-time.
- **Explainable Wait Estimates:** See exactly *why* you are waiting, factoring in current queue size, average service time, and doctors on duty.
- **Multi-Department Support:** Seamlessly manage distinct queues across different hospital departments (e.g., Cardiology, Orthopedics).
- **Persistent Patient History:** Complete consultation histories mapped to individual patient profiles.
- **Role-Based Access Control (RBAC):** Distinct dashboards and capabilities for Patients, Staff, and Administrators.
- **Full Localization (22 Indian Languages):** Accessible immediately in 22 regional languages without requiring a page reload.

### Bonus Innovations (B1 - B3)
- **B1: Advanced Wait Estimations:** Highly intelligent rule-based estimation tracking arrival rate, service rate, and queue size. *(Note: Machine learning predictive models are planned for future phases, current estimation is algorithmic).*
- **B2: Kiosk Mode:** Dedicated, premium touch-first self-service terminal UI for walk-in patients.
- **B3: Priority Processing:** Dynamic triage prioritizing elderly, pregnant, or emergency patients above regular walk-ins.

### Admin & Intelligence Extras
- **Bottleneck Detection:** Automated alerts for when arrival rates drastically exceed service rates.
- **What-If Queue Simulation:** Interactive tool to model how adding or removing doctors affects average wait times.
- **Real-Time Analytics:** Dashboards for queue performance and patient throughput.
- **Audit Logging:** System-wide traceability for actions (joining, calling, skipping, completing).
- **Privacy-By-Design:** Anonymous homepage preview preventing PII leakage without authentication.

### Enterprise Features
- **Authentication System:** Robust JWT-based authentication.
- **OTP Verification:** Highly secure OTP flows using cryptographically secure randomization.
- **Email Delivery:** Direct Email OTP fallback delivery using SMTP logic.
- **Design System:** Premium dark/light themes, keyboard accessibility, mobile-responsive screens.

---

## 🏗 Technology Stack & Architecture

- **Frontend:** Next.js 15, React, TypeScript, Tailwind CSS v4, Lucide React, Recharts.
- **Backend:** Node.js, Express, TypeScript, Socket.IO.
- **Database:** PostgreSQL (Core Storage), Prisma ORM.
- **Translation Engine:** Pre-generated local JSON dictionaries powered offline (Gemini used purely as a generator, not a runtime dependency).

### System Architecture
MediQueue utilizes a separated client-server architecture:
- `apps/web`: The Next.js frontend serving all roles.
- `apps/api`: The Express backend managing API requests and real-time Socket.IO broadcasts for queue state mutations.

---

## 🛠 Installation & Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)
- npm or yarn

### 1. Database Setup
Create a PostgreSQL database for the project:
```bash
createdb queuecare
```

### 2. Environment Variables
Create `.env` in `apps/api/`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/queuecare"
JWT_SECRET="your-super-secret-32-character-key"
JWT_EXPIRES_IN="7d"
OTP_MODE="SIMULATION"
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=5
OTP_RESEND_COOLDOWN_SECONDS=30
NODE_ENV="development"
DEMO_MODE="true"
PORT=5001
FRONTEND_URL="http://localhost:3000"
```

Create `.env.local` in `apps/web/`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_SOCKET_URL=http://localhost:5001
NEXT_PUBLIC_DEMO_MODE=true
GEMINI_API_KEY=
```

### 3. Install Dependencies
Run from the repository root:
```bash
cd apps/api && npm install
cd ../web && npm install
```

### 4. Database Migration & Seeding
Populate the database with synthetic testing data (departments, doctors, admin, patients).
```bash
cd apps/api
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 5. Running the Application
Start the backend API server (runs on Port **5001**):
```bash
cd apps/api
npm run dev
```
Health Check: `http://localhost:5001/health`

Start the frontend application (runs on Port **3000**):
```bash
cd apps/web
npm run dev
```

---

## 🔑 Demo Credentials

To test the application, the seed script generates the following test accounts:
- **Admin:** `+919999999999`
- **Staff (Doctor):** `+918800000001` (Check seed file for others)
- **Patient Demo:** Use any valid 10-digit Indian mobile number (e.g., `9876543210`).

*When `DEMO_MODE=true` is enabled, the OTP will be displayed directly in the UI for seamless testing.*

---

## 📊 API & Socket Events Reference

**REST APIs:**
- `POST /api/auth/send-otp` - Dispatch OTP.
- `POST /api/auth/verify-otp` - Authenticate.
- `GET /api/staff/queue` - Retrieve department active queue.
- `POST /api/staff/queue/:id/call` - Advance queue state.
- `GET /api/admin/overview` - Fetch admin performance metrics.
- `POST /api/admin/simulate` - Run what-if simulations.

**Socket.IO Events (Real-time updates):**
- `queue_updated` - Emitted to department rooms when a patient status changes.
- `queue_joined` - Emitted when a new patient enters the queue.

---

## 🧪 Testing & Validation

Run comprehensive TypeScript checks to ensure structural integrity:
```bash
cd apps/api && npx tsc --noEmit && npx prisma validate
cd ../web && npx tsc --noEmit && npm run build
```

---

## 🔮 Future Scope
- Transition rule-based wait-time estimates to historical-data trained ML predictive models.
- Enhanced analytics pipelines.
- Multi-facility geo-fencing for walk-in validations.

---
*Built for CodeVoyage HT-01. All rights reserved.*
