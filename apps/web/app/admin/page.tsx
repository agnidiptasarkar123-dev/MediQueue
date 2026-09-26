"use client";
import { useState, useEffect, useCallback } from "react";
import { Activity, Users, Clock, CheckCircle, AlertTriangle, BarChart3, Settings, FileText, LogOut, Zap, X } from "lucide-react";
import {
  getAdminOverview, getAdminDepartments, getAdminAnalytics,
  getBottlenecks, simulateQueue, getAuditLogs, logout,
} from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

type Tab = "overview" | "departments" | "analytics" | "bottlenecks" | "simulation" | "audit";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [overview, setOverview] = useState<{ patientsToday: number; currentlyWaiting: number; completedToday: number; avgWaitMinutes: number; avgServiceMinutes: number } | null>(null);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string; waiting: number; patientsToday: number; avgWaitMinutes: number; avgServiceMinutes: number; load: string; isBottleneck: boolean; arrivalRatePerHour: number; serviceRatePerHour: number }>>([]);
  const [analytics, setAnalytics] = useState<{ hourlyQueueLength: Array<{ hour: string; patients: number }>; departmentComparison: Array<{ name: string; patients: number }> } | null>(null);
  const [bottlenecks, setBottlenecks] = useState<Array<{ departmentId: string; departmentName: string; arrivalRatePerHour: number; serviceRatePerHour: number; currentWaiting: number; severity: string; recommendation: string }>>([]);
  const [auditLogs, setAuditLogs] = useState<Array<{ id: string; action: string; entityType: string; timestamp: string; actor: { phone: string; role: string; name: string } | null }>>([]);
  const [simResult, setSimResult] = useState<{ departmentName: string; current: { doctors: number; avgWaitMinutes: number }; simulated: { doctors: number; avgWaitMinutes: number }; reduction: number } | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simDeptId, setSimDeptId] = useState("");
  const [simDoctors, setSimDoctors] = useState(3);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [ovRes, deptRes, analyticsRes] = await Promise.all([
        getAdminOverview(), getAdminDepartments(), getAdminAnalytics(),
      ]);
      
      if (!ovRes.success && (ovRes.error?.code === "UNAUTHORIZED" || ovRes.error?.code === "FORBIDDEN")) {
        window.location.href = "/auth";
        return;
      }
      
      setOverview(ovRes.data || null);
      setDepartments(deptRes.data || []);
      setAnalytics(analyticsRes.data || null);
      if (deptRes.data && deptRes.data.length > 0) setSimDeptId(deptRes.data[0].id);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (tab === "bottlenecks") getBottlenecks().then((r) => setBottlenecks(r.data || []));
    if (tab === "audit") getAuditLogs().then((r) => setAuditLogs(r.data || []));
  }, [tab]);

  async function runSimulation() {
    setSimLoading(true);
    const res = await simulateQueue({ departmentId: simDeptId, doctorsCount: simDoctors });
    setSimResult(res.data || null);
    setSimLoading(false);
  }

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "departments", label: "Departments", icon: <Settings className="w-4 h-4" /> },
    { id: "analytics", label: "Analytics", icon: <Activity className="w-4 h-4" /> },
    { id: "bottlenecks", label: "Bottlenecks", icon: <AlertTriangle className="w-4 h-4" /> },
    { id: "simulation", label: "What-if", icon: <Zap className="w-4 h-4" /> },
    { id: "audit", label: "Audit Logs", icon: <FileText className="w-4 h-4" /> },
  ];

  if (loading) return <AdminSkeleton />;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-surface border-b border-border">
        <div className="page-container py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="MediQueue" className="h-8 dark:brightness-110" />
            <div>
              <span className="font-bold text-text-main hidden sm:inline-block">MediQueue</span>
              <span className="ml-2 badge-slate text-primary text-xs">Admin</span>
            </div>
          </div>
          <button className="btn-icon" onClick={logout}><LogOut className="w-4 h-4" /></button>
        </div>
      </nav>

      <div className="page-container py-6">
        {/* Tab navigation */}
        <div className="flex gap-1 bg-border/30 p-1 rounded-2xl mb-6 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                tab === t.id ? "bg-surface shadow-sm text-text-main font-semibold" : "text-muted hover:text-text-main"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── Overview ─────────────────────────────────────────────────────── */}
        {tab === "overview" && overview && (
          <div className="animate-fade-in-up">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {[
                { label: "Patients Today", value: overview.patientsToday, icon: <Users className="w-5 h-5 text-primary" />, color: "border-border bg-background" },
                { label: "Currently Waiting", value: overview.currentlyWaiting, icon: <Clock className="w-5 h-5 text-amber-600" />, color: "border-amber-200 bg-amber-50" },
                { label: "Completed Today", value: overview.completedToday, icon: <CheckCircle className="w-5 h-5 text-success" />, color: "border-green-200 bg-green-50" },
                { label: "Avg Wait", value: `${overview.avgWaitMinutes} min`, icon: <Clock className="w-5 h-5 text-muted" />, color: "border-border bg-background" },
                { label: "Avg Consultation", value: `${overview.avgServiceMinutes} min`, icon: <Activity className="w-5 h-5 text-primary" />, color: "border-border bg-background" },
              ].map((s) => (
                <div key={s.label} className={`stat-card border-2 ${s.color}`}>
                  <div className="flex items-center justify-between mb-3">{s.icon}<span className="text-3xl font-extrabold text-text-main">{s.value}</span></div>
                  <div className="text-xs text-muted font-medium">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Department summary */}
            <div className="card overflow-hidden">
              <div className="p-5 border-b border-border/50">
                <h2 className="font-bold text-text-main">Department Summary</h2>
              </div>
              <table className="w-full">
                <thead className="table-header">
                  <tr>
                    <th>Department</th>
                    <th>Patients Today</th>
                    <th>Waiting</th>
                    <th>Avg Wait</th>
                    <th>Avg Service</th>
                    <th>Load</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((d) => (
                    <tr key={d.id} className="table-row">
                      <td className="font-semibold text-text-main">{d.name}</td>
                      <td>{d.patientsToday}</td>
                      <td>{d.waiting}</td>
                      <td>{d.avgWaitMinutes}m</td>
                      <td>{d.avgServiceMinutes}m</td>
                      <td>
                        <span className={`badge-${d.load === "Critical" ? "red" : d.load === "High Load" ? "amber" : "green"}`}>
                          {d.load}
                        </span>
                        {d.isBottleneck && <span className="ml-1 badge-red">⚠ Bottleneck</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Analytics ────────────────────────────────────────────────────── */}
        {tab === "analytics" && analytics && (
          <div className="animate-fade-in-up space-y-6">
            <div className="card p-6">
              <h2 className="font-bold text-text-main mb-4">Queue Volume by Hour (Today)</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={analytics.hourlyQueueLength}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                  <Bar dataKey="patients" fill="#0F172A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-6">
              <h2 className="font-bold text-text-main mb-4">Patients by Department (Today)</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analytics.departmentComparison} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={120} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                  <Bar dataKey="patients" fill="#0F172A" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Bottlenecks ──────────────────────────────────────────────────── */}
        {tab === "bottlenecks" && (
          <div className="animate-fade-in-up space-y-4">
            {bottlenecks.length === 0 ? (
              <div className="card p-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h2 className="font-bold text-text-main">No Bottlenecks Detected</h2>
                <p className="text-muted text-sm mt-2">All departments are operating within normal parameters.</p>
              </div>
            ) : bottlenecks.map((b) => (
              <div key={b.departmentId} className={`card p-6 border-2 ${b.severity === "CRITICAL" ? "border-red-400 bg-danger/10" : "border-amber-400 bg-amber-50"}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`w-6 h-6 ${b.severity === "CRITICAL" ? "text-danger" : "text-amber-600"}`} />
                    <div>
                      <h3 className="font-bold text-text-main">{b.departmentName} Bottleneck</h3>
                      <span className={`badge-${b.severity === "CRITICAL" ? "red" : "amber"}`}>{b.severity}</span>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-muted">Currently waiting</div>
                    <div className="text-2xl font-bold text-text-main">{b.currentWaiting}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-surface/60 rounded-xl p-3">
                    <div className="text-xs text-muted">Arrival Rate</div>
                    <div className="font-bold text-text-main">{b.arrivalRatePerHour}/hour</div>
                  </div>
                  <div className="bg-surface/60 rounded-xl p-3">
                    <div className="text-xs text-muted">Service Rate</div>
                    <div className="font-bold text-text-main">{b.serviceRatePerHour}/hour</div>
                  </div>
                </div>
                {b.recommendation && (
                  <div className="bg-surface/60 rounded-xl p-3 text-sm text-muted">
                    💡 <strong>Recommendation:</strong> {b.recommendation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Simulation ───────────────────────────────────────────────────── */}
        {tab === "simulation" && (
          <div className="animate-fade-in-up max-w-2xl">
            <div className="card p-6 mb-6">
              <h2 className="font-bold text-text-main mb-2">Queue Simulation</h2>
              <p className="text-muted text-sm mb-6">Model how adding doctors would affect average wait time. This is a simulation, not a guaranteed outcome.</p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm font-semibold text-text-main mb-1 block">Department</label>
                  <select className="input" value={simDeptId} onChange={(e) => setSimDeptId(e.target.value)}>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-text-main mb-1 block">
                    Simulated number of doctors: <span className="text-primary">{simDoctors}</span>
                  </label>
                  <input
                    type="range" min={1} max={10} value={simDoctors}
                    onChange={(e) => setSimDoctors(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted mt-1">
                    <span>1 doctor</span><span>10 doctors</span>
                  </div>
                </div>
              </div>

              <button className="btn-primary w-full py-3.5" onClick={runSimulation} disabled={simLoading}>
                <Zap className="w-4 h-4" />
                {simLoading ? "Running simulation..." : "Run Simulation"}
              </button>
            </div>

            {simResult && (
              <div className="card p-6 animate-fade-in-up">
                <h3 className="font-bold text-text-main mb-4">Simulation Results — {simResult.departmentName}</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-background rounded-xl p-4">
                    <div className="text-xs text-muted font-semibold uppercase">Current</div>
                    <div className="text-3xl font-extrabold text-text-main mt-1">{simResult.current.avgWaitMinutes}m</div>
                    <div className="text-sm text-muted">{simResult.current.doctors} doctor(s)</div>
                  </div>
                  <div className="bg-border/30 rounded-xl p-4">
                    <div className="text-xs text-primary font-semibold uppercase">Projected</div>
                    <div className="text-3xl font-extrabold text-primary mt-1">{simResult.simulated.avgWaitMinutes}m</div>
                    <div className="text-sm text-primary">{simResult.simulated.doctors} doctor(s)</div>
                  </div>
                </div>
                {simResult.reduction > 0 ? (
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-extrabold text-green-700">-{simResult.reduction} min</div>
                    <div className="text-sm text-success mt-1">Potential reduction in average wait time</div>
                  </div>
                ) : (
                  <div className="bg-background rounded-xl p-4 text-center text-muted text-sm">
                    No significant improvement projected with these parameters.
                  </div>
                )}
                <div className="mt-4 text-xs text-muted text-center">
                  ⚠ This is a simulation estimate, not a guaranteed real-world result.
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Audit Logs ───────────────────────────────────────────────────── */}
        {tab === "audit" && (
          <div className="animate-fade-in-up card overflow-hidden">
            <div className="p-5 border-b border-border/50">
              <h2 className="font-bold text-text-main">Audit Logs</h2>
              <p className="text-sm text-muted mt-1">Recent staff and admin actions</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="table-header">
                  <tr>
                    <th>Timestamp</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Entity</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-12 text-center text-muted text-sm">No audit logs yet</td></tr>
                  ) : auditLogs.map((log) => (
                    <tr key={log.id} className="table-row">
                      <td className="text-xs text-muted whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString("en-IN")}
                      </td>
                      <td>
                        <div className="font-medium text-text-main text-sm">{log.actor?.name || "System"}</div>
                        <div className="text-xs text-muted">{log.actor?.role}</div>
                      </td>
                      <td><span className="badge-slate text-primary">{log.action.replace(/_/g, " ")}</span></td>
                      <td className="text-xs text-muted">{log.entityType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Department Management ─────────────────────────────────────────── */}
        {tab === "departments" && (
          <div className="animate-fade-in-up space-y-4">
            {departments.map((dept) => (
              <div key={dept.id} className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-text-main">{dept.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`badge-${dept.load === "Critical" ? "red" : dept.load === "High Load" ? "amber" : "green"}`}>{dept.load}</span>
                      {dept.isBottleneck && <span className="badge-red">⚠ Bottleneck</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-text-main">{dept.waiting}</div>
                    <div className="text-xs text-muted">waiting now</div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 text-center text-sm">
                  <div className="bg-background rounded-xl p-3">
                    <div className="font-bold text-text-main">{dept.patientsToday}</div>
                    <div className="text-xs text-muted">Today</div>
                  </div>
                  <div className="bg-background rounded-xl p-3">
                    <div className="font-bold text-text-main">{dept.avgWaitMinutes}m</div>
                    <div className="text-xs text-muted">Avg wait</div>
                  </div>
                  <div className="bg-background rounded-xl p-3">
                    <div className="font-bold text-text-main">{dept.avgServiceMinutes}m</div>
                    <div className="text-xs text-muted">Avg service</div>
                  </div>
                  <div className="bg-background rounded-xl p-3">
                    <div className="font-bold text-text-main">{dept.arrivalRatePerHour}/h</div>
                    <div className="text-xs text-muted">Arrival rate</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-16 bg-surface border-b border-border" />
      <div className="page-container py-6 space-y-6">
        <div className="skeleton h-12 rounded-2xl" />
        <div className="grid grid-cols-5 gap-4">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
        <div className="skeleton h-80 rounded-2xl" />
      </div>
    </div>
  );
}
