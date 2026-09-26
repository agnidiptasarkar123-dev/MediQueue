"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, Bell, Clock, Plus, ChevronRight, LogOut, User, FileText } from "lucide-react";
import { getMe, getPatientAppointments, getDepartments, getNotifications, logout } from "@/lib/api";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export default function PatientDashboard() {
  const router = useRouter();
  const [me, setMe] = useState<{ id: string; phone: string; patient: { fullName: string } | null } | null>(null);
  const [appointments, setAppointments] = useState<Array<{ id: string; status: string; appointmentDate: string; department: { name: string }; queueEntry: { tokenDisplay: string } | null }>>([]);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string; waitingCount: number; estimatedWaitMinutes: number }>>([]);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; createdAt: string; isRead: boolean }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [meRes, apptRes, deptRes, notifRes] = await Promise.all([
        getMe(), getPatientAppointments(), getDepartments(), getNotifications(),
      ]);
      if (!meRes.success) { router.push("/auth"); return; }
      setMe(meRes.data || null);
      setAppointments(apptRes.data?.slice(0, 3) || []);
      setDepartments(deptRes.data?.slice(0, 3) || []);
      setNotifications(notifRes.data?.slice(0, 3) || []);
      setLoading(false);
    }
    load();
  }, [router]);

  const activeAppointment = appointments.find((a) => ["WAITING", "CALLED", "IN_CONSULTATION"].includes(a.status));
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-surface border-b border-border">
        <div className="page-container py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-accent rounded-lg px-2 py-1">
              <img src="/logo.svg" alt="MediQueue" className="h-8 dark:brightness-110" />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <Link href="/patient/notifications" className="btn-icon relative">
              <Bell className="w-4.5 h-4.5" />
              {notifications.filter((n) => !n.isRead).length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notifications.filter((n) => !n.isRead).length}
                </span>
              )}
            </Link>
            <button className="btn-icon" onClick={logout}>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <div className="page-container py-8">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-text-main">
            {greeting}, {me?.patient?.fullName?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="text-muted mt-1">Track your appointments and live queue status.</p>
        </div>

        {/* Active appointment hero card */}
        {activeAppointment && activeAppointment.queueEntry && (
          <div className="bg-primary rounded-3xl p-6 md:p-8 text-white mb-8 shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-slate-300 text-sm font-medium">ACTIVE APPOINTMENT</div>
                <div className="text-xl font-bold mt-1">{activeAppointment.department.name}</div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                activeAppointment.status === "IN_CONSULTATION" ? "bg-success text-white" : "bg-slate-700 text-white"
              }`}>
                {activeAppointment.status.replace("_", " ")}
              </span>
            </div>
            <div className="text-center py-4">
              <div className="font-mono text-6xl font-extrabold tracking-widest">
                {activeAppointment.queueEntry.tokenDisplay}
              </div>
              <div className="text-slate-300 text-sm mt-1">Your Token</div>
            </div>
            <Link
              href={`/patient/queue?id=${activeAppointment.id}`}
              className="block w-full text-center bg-surface/10 hover:bg-surface/20 text-white border border-white/20 font-semibold py-3 rounded-2xl transition-colors mt-4"
            >
              View Live Queue →
            </Link>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: "🏥", title: "Book Appointment", href: "/patient/dashboard/book", color: "bg-background" },
            { icon: "🎫", title: "Join Live Queue", href: "/patient/dashboard/join", color: "bg-green-50" },
            { icon: "📋", title: "My Appointments", href: "/patient/appointments", color: "bg-background" },
            { icon: "🔔", title: "Notifications", href: "/patient/notifications", color: "bg-amber-50" },
          ].map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className={`card p-5 flex flex-col items-center gap-2 text-center hover:shadow-md transition-shadow ${action.color}`}
            >
              <span className="text-3xl">{action.icon}</span>
              <span className="text-sm font-semibold text-text-main">{action.title}</span>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Departments */}
          <div className="lg:col-span-2 card p-0 overflow-hidden">
            <div className="p-5 border-b border-border/50 flex items-center justify-between">
              <h2 className="font-semibold text-text-main">Available Departments</h2>
              <Link href="/patient/dashboard/join" className="text-sm text-primary font-medium hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {departments.map((dept) => (
                <Link
                  key={dept.id}
                  href={`/patient/dashboard/join?dept=${dept.id}`}
                  className="flex items-center justify-between p-4 hover:bg-background transition-colors"
                >
                  <div>
                    <div className="font-semibold text-text-main">{dept.name}</div>
                    <div className="text-sm text-muted mt-0.5">
                      {dept.waitingCount} waiting · ~{dept.estimatedWaitMinutes} min
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge-${dept.waitingCount > 15 ? "red" : dept.waitingCount > 8 ? "amber" : "green"}`}>
                      {dept.waitingCount > 15 ? "Busy" : dept.waitingCount > 8 ? "Moderate" : "Available"}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent notifications */}
          <div className="card p-0 overflow-hidden">
            <div className="p-5 border-b border-border/50 flex items-center justify-between">
              <h2 className="font-semibold text-text-main">Recent Alerts</h2>
              <Link href="/patient/notifications" className="text-sm text-primary font-medium hover:underline">All</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted text-sm">No notifications yet</div>
              ) : notifications.map((n) => (
                <div key={n.id} className={`p-4 ${!n.isRead ? "bg-background" : ""}`}>
                  <div className="font-semibold text-text-main text-sm">{n.title}</div>
                  <div className="text-xs text-muted mt-1 line-clamp-2">{n.message}</div>
                  <div className="text-xs text-muted mt-2">
                    {new Date(n.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent appointments */}
        {appointments.length > 0 && (
          <div className="card p-0 overflow-hidden mt-6">
            <div className="p-5 border-b border-border/50 flex items-center justify-between">
              <h2 className="font-semibold text-text-main">Recent Appointments</h2>
              <Link href="/patient/appointments" className="text-sm text-primary font-medium hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {appointments.map((appt) => (
                <div key={appt.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-border/30 rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold text-text-main text-sm">{appt.department.name}</div>
                      <div className="text-xs text-muted">
                        {new Date(appt.appointmentDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        {appt.queueEntry && ` · Token: ${appt.queueEntry.tokenDisplay}`}
                      </div>
                    </div>
                  </div>
                  <span className={`status-${appt.status}`}>{appt.status.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-16 bg-surface border-b border-border" />
      <div className="page-container py-8 space-y-6">
        <div className="skeleton h-10 w-64" />
        <div className="skeleton h-48 rounded-3xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    </div>
  );
}
