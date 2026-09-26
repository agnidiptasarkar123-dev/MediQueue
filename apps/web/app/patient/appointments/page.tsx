"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Clock } from "lucide-react";
import { getPatientAppointments } from "@/lib/api";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Array<{
    id: string; status: string; appointmentDate: string; isWalkIn?: boolean;
    department: { name: string };
    queueEntry: { tokenDisplay: string; patientsAhead?: number; estimatedWaitMinutes?: number } | null;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPatientAppointments().then((r) => {
      setAppointments(r.data || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-surface border-b border-border sticky top-0 z-10">
        <div className="page-container py-4 flex items-center gap-4">
          <Link href="/patient/dashboard" className="btn-icon"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="font-bold text-text-main">My Appointments</h1>
        </div>
      </div>

      <div className="page-container py-6 max-w-2xl mx-auto">
        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
        ) : appointments.length === 0 ? (
          <div className="card p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="font-semibold text-text-main">No appointments yet</h2>
            <p className="text-muted text-sm mt-1">Join a queue or book an appointment to get started.</p>
            <Link href="/patient/dashboard/join" className="btn-primary mt-4">Join a Queue</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((appt) => (
              <div key={appt.id} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <div className="font-semibold text-text-main">{appt.department.name}</div>
                      <div className="text-xs text-muted flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(appt.appointmentDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        {appt.isWalkIn && " · Walk-in"}
                      </div>
                    </div>
                  </div>
                  <span className={`status-${appt.status}`}>{appt.status.replace(/_/g, " ")}</span>
                </div>
                {appt.queueEntry && (
                  <div className="flex items-center justify-between bg-background rounded-xl p-3">
                    <span className="font-mono font-bold text-accent">{appt.queueEntry.tokenDisplay}</span>
                    {["WAITING", "CALLED"].includes(appt.status) && (
                      <Link href={`/patient/queue?id=${appt.queueEntry && "id" in appt.queueEntry ? (appt.queueEntry as { id?: string }).id || "" : ""}`} className="text-sm text-accent font-semibold hover:text-accent">
                        View Live →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
