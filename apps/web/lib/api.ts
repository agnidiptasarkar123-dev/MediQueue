const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: { code: string; message: string };
}

function getAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") return { "Content-Type": "application/json" };
  const token = localStorage.getItem("qc_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...getAuthHeaders(), ...(options.headers || {}) },
  });

  const data = await response.json();
  return data;
}

// ── Auth ────────────────────────────────────────────────────────────────────

export async function sendOtp(method: "phone" | "email", identifier: string) {
  const body = method === "email" ? { method: "email", email: identifier } : { method: "phone", phone: identifier };
  return request<{ maskedPhone: string; expiresAt: string; expiresInSeconds: number; resendCooldownSeconds: number; demoOtp?: string }>("/api/auth/send-otp", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function verifyOtp(method: "phone" | "email", identifier: string, otp: string) {
  const body = method === "email" ? { method: "email", email: identifier, otp } : { method: "phone", phone: identifier, otp };
  const res = await request<{ token: string; user: { id: string; phone: string; email: string; role: string; name: string; needsProfileSetup: boolean } }>("/api/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (res.success && res.data?.token) {
    localStorage.setItem("qc_token", res.data.token);
    localStorage.setItem("qc_user", JSON.stringify(res.data.user));
  }

  return res;
}

export async function setupProfile(data: {
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  consentGiven: boolean;
}) {
  return request("/api/auth/setup-profile", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMe() {
  return request<{ id: string; phone: string; role: string; patient: { fullName: string } | null }>("/api/auth/me");
}

export function logout() {
  localStorage.removeItem("qc_token");
  localStorage.removeItem("qc_user");
  window.location.href = "/auth";
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    const u = localStorage.getItem("qc_user");
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
}

export function getStoredToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("qc_token");
}

// ── Departments ──────────────────────────────────────────────────────────────

export async function getDepartments() {
  return request<Array<{
    id: string; name: string; code: string; description: string;
    waitingCount: number; estimatedWaitMinutes: number; activeDoctors: number;
  }>>("/api/departments");
}

export async function getDepartmentDoctors(departmentId: string) {
  return request<Array<{
    id: string; name: string; specialization: string; roomNumber: string;
    waitingCount: number; estimatedWaitMinutes: number;
  }>>(`/api/departments/${departmentId}/doctors`);
}

// ── Queue ────────────────────────────────────────────────────────────────────

export async function joinQueue(data: { departmentId: string; staffProfileId?: string; isWalkIn?: boolean }) {
  return request<{
    queueEntryId: string; tokenDisplay: string; position: number;
    patientsAhead: number; estimatedWaitMinutes: number; qrCodeDataUrl: string;
    department: { id: string; name: string; code: string };
  }>("/api/queue/join", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getQueueEntry(id: string) {
  return request<{
    id: string; tokenDisplay: string; position: number;
    patientsAhead: number; estimatedWaitMinutes: number; status: string;
    explanation: { patientsAhead: number; avgServiceMinutes: number; activeDoctors: number; priorityPatientsAhead: number };
    appointment: { department: { name: string }; patient: { fullName: string } };
    staffProfile: { fullName: string; roomNumber: string } | null;
  }>(`/api/queue/${id}`);
}

export async function getPatientAppointments() {
  return request<Array<{
    id: string; status: string; appointmentDate: string; isWalkIn?: boolean;
    department: { name: string }; queueEntry: { tokenDisplay: string; patientsAhead?: number; estimatedWaitMinutes?: number } | null;
  }>>("/api/appointments");
}

export async function getNotifications() {
  return request<Array<{
    id: string; type: string; title: string; message: string;
    isRead: boolean; createdAt: string;
  }>>("/api/notifications");
}

export async function bookAppointment(data: {
  departmentId: string; staffProfileId?: string;
  appointmentDate: string; slotStart?: string; slotEnd?: string;
}) {
  return request("/api/appointments/book", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Staff ────────────────────────────────────────────────────────────────────

export async function getStaffQueue() {
  return request<{
    queue: Array<{
      id: string; tokenDisplay: string; status: string; priority: string;
      joinedAt: string; estimatedWaitMinutes: number;
      appointment: { patient: { fullName: string; user: { phone: string } } };
    }>;
    stats: { waiting: number; inConsultation: number; called: number; completedToday: number; avgServiceMinutes: number };
    staffProfile: { fullName: string; roomNumber: string; departmentId: string };
  }>("/api/staff/queue");
}

export async function callPatient(queueEntryId: string) {
  return request(`/api/staff/queue/${queueEntryId}/call`, { method: "POST" });
}

export async function skipPatient(queueEntryId: string, reason?: string) {
  return request(`/api/staff/queue/${queueEntryId}/skip`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function markNoShow(queueEntryId: string) {
  return request(`/api/staff/queue/${queueEntryId}/no-show`, { method: "POST" });
}

export async function startConsultation(queueEntryId: string) {
  return request(`/api/staff/queue/${queueEntryId}/start`, { method: "POST" });
}

export async function completeConsultation(queueEntryId: string) {
  return request(`/api/staff/queue/${queueEntryId}/complete`, { method: "POST" });
}

// ── Admin ────────────────────────────────────────────────────────────────────

export async function getAdminOverview() {
  return request<{
    patientsToday: number; currentlyWaiting: number;
    completedToday: number; avgWaitMinutes: number; avgServiceMinutes: number;
  }>("/api/admin/overview");
}

export async function getAdminDepartments() {
  return request<Array<{
    id: string; name: string; patientsToday: number; waiting: number;
    completedToday: number; avgWaitMinutes: number; avgServiceMinutes: number;
    activeDoctors: number; load: string; isBottleneck: boolean;
    arrivalRatePerHour: number; serviceRatePerHour: number;
  }>>("/api/admin/departments");
}

export async function getAdminAnalytics() {
  return request<{
    hourlyQueueLength: Array<{ hour: string; patients: number }>;
    departmentComparison: Array<{ name: string; patients: number }>;
  }>("/api/admin/analytics");
}

export async function getBottlenecks() {
  return request<Array<{
    departmentId: string; departmentName: string;
    arrivalRatePerHour: number; serviceRatePerHour: number;
    currentWaiting: number; severity: string; recommendation: string;
  }>>("/api/admin/bottlenecks");
}

export async function simulateQueue(data: {
  departmentId: string; doctorsCount?: number;
  arrivalRateMultiplier?: number; avgConsultationMinutes?: number;
}) {
  return request<{
    departmentName: string;
    current: { doctors: number; avgWaitMinutes: number; patientsWaiting: number };
    simulated: { doctors: number; avgWaitMinutes: number; patientsWaiting: number };
    reduction: number;
  }>("/api/admin/simulate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getAuditLogs() {
  return request<Array<{
    id: string; action: string; entityType: string; timestamp: string;
    actor: { phone: string; role: string; name: string } | null;
  }>>("/api/admin/audit-logs");
}
