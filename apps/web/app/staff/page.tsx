"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Activity, Users, Clock, CheckCircle, LogOut, Bell, Phone, Zap, SkipForward, X, Play, Check } from "lucide-react";
import {
  getStaffQueue, callPatient, skipPatient, markNoShow,
  startConsultation, completeConsultation, logout,
} from "@/lib/api";
import { useSocket } from "@/lib/socket";

interface QueueEntry {
  id: string;
  tokenDisplay: string;
  status: string;
  priority: string;
  joinedAt: string;
  estimatedWaitMinutes: number;
  appointment: { patient: { fullName: string; user: { phone: string } } };
}

interface Stats {
  waiting: number;
  inConsultation: number;
  called: number;
  completedToday: number;
  avgServiceMinutes: number;
}

export default function StaffPage() {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [staffProfile, setStaffProfile] = useState<{ fullName: string; roomNumber: string; departmentId: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [skipReason, setSkipReason] = useState("");
  const [showSkipModal, setShowSkipModal] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    const res = await getStaffQueue();
    if (!res.success) {
      if (res.error?.code === "UNAUTHORIZED" || res.error?.code === "FORBIDDEN") {
        window.location.href = "/auth";
      }
      return;
    }
    if (res.data) {
      setQueue(res.data.queue);
      setStats(res.data.stats);
      setStaffProfile(res.data.staffProfile);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadQueue(); }, [loadQueue]);

  // Real-time updates
  useSocket({
    "queue:updated": () => loadQueue(),
  });

  async function handleAction(action: "call" | "no-show" | "start" | "complete", entryId: string) {
    setActionLoading(entryId + action);
    setError("");
    try {
      let res;
      if (action === "call") res = await callPatient(entryId);
      else if (action === "no-show") res = await markNoShow(entryId);
      else if (action === "start") res = await startConsultation(entryId);
      else res = await completeConsultation(entryId);

      if (!res.success) setError(res.error?.message || "Action failed");
      else await loadQueue();
    } catch {
      setError("Network error");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSkip(entryId: string) {
    setActionLoading(entryId + "skip");
    setError("");
    try {
      const res = await skipPatient(entryId, skipReason);
      if (!res.success) setError(res.error?.message || "Skip failed");
      else { await loadQueue(); setShowSkipModal(null); setSkipReason(""); }
    } catch {
      setError("Network error");
    } finally {
      setActionLoading(null);
    }
  }

  const currentPatient = queue.find((e) => e.status === "IN_CONSULTATION") || queue.find((e) => e.status === "CALLED");
  const waitingQueue = queue.filter((e) => e.status === "WAITING");
  const nextPatient = waitingQueue[0];

  if (loading) return <StaffSkeleton />;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-surface border-b border-border">
        <div className="page-container py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-text-main">MediQueue</div>
              {staffProfile && (
                <div className="text-xs text-muted flex items-center gap-1">
                  <div className="live-dot">LIVE</div>
                  · {staffProfile.fullName} · {staffProfile.roomNumber}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge-slate text-primary hidden md:flex">Staff Panel</span>
            <button className="btn-icon" onClick={logout}><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </nav>

      <div className="page-container py-6">
        {error && (
          <div className="bg-danger/10 border border-red-200 rounded-xl p-4 mb-4 flex items-center justify-between">
            <span className="text-red-700 text-sm">{error}</span>
            <button onClick={() => setError("")}><X className="w-4 h-4 text-red-500" /></button>
          </div>
        )}

        {/* ── Stats ─────────────────────────────────────────────────────────── */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {[
              { label: "Waiting", value: stats.waiting, icon: <Users className="w-5 h-5 text-primary" />, color: "bg-background" },
              { label: "Called", value: stats.called, icon: <Bell className="w-5 h-5 text-amber-600" />, color: "bg-amber-50" },
              { label: "In Consultation", value: stats.inConsultation, icon: <Activity className="w-5 h-5 text-success" />, color: "bg-green-50" },
              { label: "Completed Today", value: stats.completedToday, icon: <CheckCircle className="w-5 h-5 text-muted" />, color: "bg-background" },
              { label: "Avg Service", value: `${stats.avgServiceMinutes.toFixed(1)}m`, icon: <Clock className="w-5 h-5 text-muted" />, color: "bg-background" },
            ].map((s) => (
              <div key={s.label} className={`card p-4 ${s.color}`}>
                <div className="flex items-center justify-between mb-2">
                  {s.icon}
                  <span className="text-2xl font-extrabold text-text-main">{s.value}</span>
                </div>
                <div className="text-xs text-muted font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Current Patient Card ──────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <h2 className="font-bold text-text-main mb-4">
                {currentPatient ? "Now Serving" : nextPatient ? "Next Patient" : "Queue Empty"}
              </h2>

              {currentPatient && (
                <div className="animate-fade-in">
                  <div className="text-center mb-6">
                    <div className="token-display mb-1">{currentPatient.tokenDisplay}</div>
                    <div className="font-semibold text-text-main text-lg">{currentPatient.appointment.patient.fullName}</div>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span className={`status-${currentPatient.status}`}>{currentPatient.status.replace(/_/g, " ")}</span>
                      <span className={`priority-${currentPatient.priority} text-xs`}>{currentPatient.priority}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {currentPatient.status === "CALLED" && (
                      <>
                        <button
                          className="btn-success w-full"
                          onClick={() => handleAction("start", currentPatient.id)}
                          disabled={!!actionLoading}
                        >
                          <Play className="w-4 h-4" />
                          {actionLoading === currentPatient.id + "start" ? "Starting..." : "Start Consultation"}
                        </button>
                        <button
                          className="btn-danger w-full"
                          onClick={() => handleAction("no-show", currentPatient.id)}
                          disabled={!!actionLoading}
                        >
                          <X className="w-4 h-4" />
                          {actionLoading === currentPatient.id + "no-show" ? "..." : "Mark No-show"}
                        </button>
                      </>
                    )}
                    {currentPatient.status === "IN_CONSULTATION" && (
                      <button
                        className="btn-primary w-full py-3.5"
                        onClick={() => handleAction("complete", currentPatient.id)}
                        disabled={!!actionLoading}
                      >
                        <Check className="w-5 h-5" />
                        {actionLoading === currentPatient.id + "complete" ? "Completing..." : "Complete Consultation"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {!currentPatient && nextPatient && (
                <div className="animate-fade-in text-center">
                  <div className="text-muted mb-4 text-sm">Ready for next patient</div>
                  <div className="token-display text-primary mb-2">{nextPatient.tokenDisplay}</div>
                  <div className="font-semibold text-text-main mb-4">{nextPatient.appointment.patient.fullName}</div>
                  <button
                    className="btn-primary w-full py-3.5"
                    onClick={() => handleAction("call", nextPatient.id)}
                    disabled={!!actionLoading}
                  >
                    <Zap className="w-4 h-4" />
                    {actionLoading === nextPatient.id + "call" ? "Calling..." : "Call Next Patient"}
                  </button>
                </div>
              )}

              {!currentPatient && !nextPatient && (
                <div className="text-center py-8 text-muted">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
                  <div className="font-semibold">Queue is empty</div>
                  <div className="text-sm mt-1">No patients waiting</div>
                </div>
              )}
            </div>
          </div>

          {/* ── Queue Table ───────────────────────────────────────────────── */}
          <div className="lg:col-span-2 card overflow-hidden">
            <div className="p-5 border-b border-border/50">
              <h2 className="font-bold text-text-main">Patient Queue</h2>
              <p className="text-sm text-muted mt-1">{waitingQueue.length} waiting · {stats?.called || 0} called</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="table-header">
                  <tr>
                    <th>Token</th>
                    <th>Patient</th>
                    <th>Priority</th>
                    <th>Wait</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-muted text-sm">No patients in queue</td></tr>
                  ) : queue.map((entry) => (
                    <tr key={entry.id} className="table-row">
                      <td><span className="font-mono font-bold text-primary">{entry.tokenDisplay}</span></td>
                      <td>
                        <div className="font-medium text-text-main">{entry.appointment.patient.fullName}</div>
                        <div className="text-xs text-muted flex items-center gap-1">
                          <Phone className="w-3 h-3" />{entry.appointment.patient.user.phone.replace("+91", "")}
                        </div>
                      </td>
                      <td><span className={`priority-${entry.priority}`}>{entry.priority}</span></td>
                      <td className="text-muted text-sm">{entry.estimatedWaitMinutes}m</td>
                      <td><span className={`status-${entry.status}`}>{entry.status.replace(/_/g, " ")}</span></td>
                      <td>
                        <div className="flex items-center gap-1">
                          {entry.status === "WAITING" && (
                            <>
                              <button
                                className="btn-primary text-xs px-2.5 py-1.5"
                                onClick={() => handleAction("call", entry.id)}
                                disabled={!!actionLoading || !!currentPatient}
                                title="Call patient"
                              >
                                Call
                              </button>
                              <button
                                className="btn-secondary text-xs px-2.5 py-1.5"
                                onClick={() => setShowSkipModal(entry.id)}
                                disabled={!!actionLoading}
                                title="Skip patient"
                              >
                                <SkipForward className="w-3 h-3" />
                              </button>
                              <button
                                className="btn-danger text-xs px-2.5 py-1.5"
                                onClick={() => handleAction("no-show", entry.id)}
                                disabled={!!actionLoading}
                                title="No-show"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </>
                          )}
                          {entry.status === "CALLED" && (
                            <>
                              <button className="btn-success text-xs px-2.5 py-1.5" onClick={() => handleAction("start", entry.id)} disabled={!!actionLoading}>Start</button>
                              <button className="btn-danger text-xs px-2.5 py-1.5" onClick={() => handleAction("no-show", entry.id)} disabled={!!actionLoading}>No-show</button>
                            </>
                          )}
                          {entry.status === "IN_CONSULTATION" && (
                            <button className="btn-primary text-xs px-2.5 py-1.5" onClick={() => handleAction("complete", entry.id)} disabled={!!actionLoading}>Complete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Skip Modal */}
      {showSkipModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-sm animate-fade-in-up">
            <h3 className="font-bold text-text-main mb-4">Skip Patient</h3>
            <p className="text-sm text-muted mb-4">Optionally provide a reason for skipping.</p>
            <input
              className="input mb-4"
              placeholder="Reason (optional)"
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
            />
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => { setShowSkipModal(null); setSkipReason(""); }}>Cancel</button>
              <button className="btn-primary flex-1" onClick={() => handleSkip(showSkipModal)} disabled={!!actionLoading}>
                Skip Patient
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StaffSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-16 bg-surface border-b border-border" />
      <div className="page-container py-6 space-y-6">
        <div className="grid grid-cols-5 gap-4">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
        <div className="grid grid-cols-3 gap-6">
          <div className="skeleton h-80 rounded-2xl" />
          <div className="col-span-2 skeleton h-80 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
