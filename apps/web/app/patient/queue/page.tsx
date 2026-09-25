"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bell, Clock, Users, Info, X, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { getQueueEntry } from "@/lib/api";
import { useSocket } from "@/lib/socket";

interface QueueData {
  id: string;
  tokenDisplay: string;
  position: number;
  patientsAhead: number;
  estimatedWaitMinutes: number;
  status: string;
  appointment: { department: { name: string } };
  staffProfile: { fullName: string; roomNumber: string } | null;
  explanation: {
    patientsAhead: number;
    avgServiceMinutes: number;
    activeDoctors: number;
    priorityPatientsAhead: number;
  };
}

function LiveQueueContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const entryId = searchParams.get("id");
  const [data, setData] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [showExplanation, setShowExplanation] = useState(false);
  const [notificationShown, setNotificationShown] = useState(false);
  const [calledNotification, setCalledNotification] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!entryId) { setError("No queue entry ID"); setLoading(false); return; }
    try {
      const res = await getQueueEntry(entryId);
      if (res.success && res.data) {
        setData(res.data);
        setLastUpdated(new Date());
        setConnected(true);

        // Check for 3-turn notification
        if (res.data.patientsAhead === 3 && !notificationShown) {
          setNotificationShown(true);
        }
        // Check if called
        if (res.data.status === "CALLED" || res.data.status === "IN_CONSULTATION") {
          setCalledNotification(true);
        }
      } else {
        setError(res.error?.message || "Queue entry not found");
      }
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, [entryId, notificationShown]);

  useEffect(() => {
    loadData();
    // Polling fallback: every 10 seconds
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Real-time via Socket.IO
  useSocket(
    {
      "queue:updated": () => { loadData(); },
      "patient:called": (d: unknown) => {
        const payload = d as { queueEntryId: string };
        if (payload.queueEntryId === entryId) { setCalledNotification(true); loadData(); }
      },
      "patient:three-away": (d: unknown) => {
        const payload = d as { queueEntryId: string };
        if (payload.queueEntryId === entryId) { setNotificationShown(true); }
      },
      connect: () => setConnected(true),
      disconnect: () => setConnected(false),
    },
    entryId ? [`queue:${entryId}`] : []
  );

  if (loading) return <QueueSkeleton />;
  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card p-8 text-center max-w-sm">
        <div className="text-4xl mb-4">😕</div>
        <h2 className="font-bold text-slate-900 mb-2">Queue entry not found</h2>
        <p className="text-slate-500 text-sm mb-4">{error}</p>
        <Link href="/patient/dashboard" className="btn-primary">Back to Dashboard</Link>
      </div>
    </div>
  );
  if (!data) return null;

  const isWaiting = data.status === "WAITING";
  const isCalled = data.status === "CALLED";
  const isInConsultation = data.status === "IN_CONSULTATION";
  const isCompleted = data.status === "COMPLETED";
  const progressPercent = isCompleted ? 100 : Math.max(5, 100 - (data.patientsAhead / 15) * 100);
  const isThreeAway = data.patientsAhead === 3 && isWaiting;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="page-container py-4 flex items-center justify-between">
          <Link href="/patient/dashboard" className="btn-icon">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="text-center">
            <div className="font-bold text-slate-900">{data.appointment.department.name}</div>
            {data.staffProfile && <div className="text-xs text-slate-500">{data.staffProfile.fullName}</div>}
          </div>
          <div className="flex items-center gap-2">
            {connected ? (
              <div className="live-dot text-xs">LIVE</div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-amber-600">
                <WifiOff className="w-3.5 h-3.5" /> Reconnecting...
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="page-container py-6 max-w-md mx-auto space-y-4">

        {/* ── 3-turn notification ──────────────────────────────────────────── */}
        {(isThreeAway || notificationShown) && isWaiting && (
          <div className="notification-3away rounded-2xl p-4 animate-fade-in-up">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-amber-800">3 patients ahead of you!</div>
                <div className="text-sm text-amber-700 mt-0.5">
                  Please proceed to the waiting area near the consultation room.
                  Have your token ready.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Called / Your turn ──────────────────────────────────────────── */}
        {(isCalled || calledNotification) && (
          <div className="notification-turn rounded-2xl p-5 animate-fade-in-up text-center">
            <div className="text-3xl mb-2">🎉</div>
            <div className="text-2xl font-extrabold text-green-800">YOUR TURN!</div>
            <div className="text-green-700 mt-2">
              Please proceed to{" "}
              <strong>{data.staffProfile?.roomNumber || "the consultation room"}</strong>.
            </div>
          </div>
        )}

        {/* ── Main Token Card ──────────────────────────────────────────────── */}
        <div className={`card p-6 text-center ${isThreeAway && isWaiting ? "border-2 border-amber-400" : ""} ${isCalled ? "border-2 border-green-500" : ""}`}>
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-3">Your Token</div>
          <div className="token-display mb-4">{data.tokenDisplay}</div>

          {/* Status badge */}
          <div className="flex justify-center mb-4">
            <span className={`status-${data.status} text-sm px-4 py-1.5`}>
              {data.status.replace(/_/g, " ")}
            </span>
          </div>

          {/* Position info */}
          {isWaiting && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="text-3xl font-extrabold text-slate-800">{data.patientsAhead}</div>
                <div className="text-xs text-slate-500 mt-1">Patients ahead</div>
              </div>
              <div className="bg-slate-100 rounded-xl p-4 border border-slate-200 shadow-sm">
                <div className="text-3xl font-extrabold text-primary">~{data.estimatedWaitMinutes}m</div>
                <div className="text-xs text-slate-500 mt-1">Estimated wait</div>
              </div>
            </div>
          )}

          {isInConsultation && (
            <div className="bg-green-50 rounded-xl p-4 mb-4">
              <div className="text-green-700 font-semibold">Consultation in progress</div>
            </div>
          )}

          {isCompleted && (
            <div className="bg-slate-100 rounded-xl p-4 mb-4">
              <div className="text-slate-600 font-semibold">✓ Consultation completed</div>
            </div>
          )}

          {/* Progress bar */}
          {isWaiting && (
            <div className="mt-2">
              <div className="queue-progress">
                <div className="queue-progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="text-xs text-slate-400 mt-1 text-right">Position #{data.position}</div>
            </div>
          )}
        </div>

        {/* ── Wait Explanation ─────────────────────────────────────────────── */}
        {isWaiting && (
          <button
            className="w-full card p-4 flex items-center justify-between hover:shadow-md transition-shadow"
            onClick={() => setShowExplanation(!showExplanation)}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
                <Info className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-slate-800">Why ~{data.estimatedWaitMinutes} minutes?</div>
                <div className="text-xs text-slate-500">Tap to see estimate breakdown</div>
              </div>
            </div>
            <span className="text-primary text-sm font-medium">{showExplanation ? "▲" : "▼"}</span>
          </button>
        )}

        {showExplanation && data.explanation && (
          <div className="card p-5 animate-fade-in-up">
            <div className="font-semibold text-slate-800 mb-4 flex items-center justify-between">
              Estimate Breakdown
              <button onClick={() => setShowExplanation(false)} className="btn-icon w-7 h-7">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                { label: "Patients ahead", value: data.explanation.patientsAhead.toString(), icon: "👥" },
                { label: "Avg. consultation time", value: `${data.explanation.avgServiceMinutes.toFixed(1)} min`, icon: "⏱" },
                { label: "Active doctors", value: data.explanation.activeDoctors.toString(), icon: "👨‍⚕️" },
                { label: "Priority patients ahead", value: data.explanation.priorityPatientsAhead.toString(), icon: "⚡" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-2">
                    {row.icon} {row.label}
                  </span>
                  <span className="font-semibold text-slate-800">{row.value}</span>
                </div>
              ))}
              <div className="border-t border-slate-100 pt-3 text-xs text-slate-400">
                Estimate = (patients ahead × avg. time) / active doctors
              </div>
            </div>
          </div>
        )}

        {/* ── Last updated indicator ───────────────────────────────────────── */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            {connected ? (
              <span className="flex items-center gap-1"><Wifi className="w-3 h-3" /> Live data</span>
            ) : (
              <span className="flex items-center gap-1 text-amber-500"><WifiOff className="w-3 h-3" /> Connection interrupted</span>
            )}
          </span>
          <span>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>

        <button className="btn-secondary w-full" onClick={loadData}>
          <RefreshCw className="w-4 h-4" /> Refresh manually
        </button>

        <Link href="/patient/dashboard" className="btn-ghost w-full justify-center">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

function QueueSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-16 bg-white border-b border-slate-200" />
      <div className="max-w-md mx-auto p-6 space-y-4">
        <div className="skeleton h-64 rounded-2xl" />
        <div className="skeleton h-16 rounded-2xl" />
        <div className="skeleton h-12 rounded-2xl" />
      </div>
    </div>
  );
}

export default function LiveQueuePage() {
  return (
    <Suspense fallback={<QueueSkeleton />}>
      <LiveQueueContent />
    </Suspense>
  );
}
