"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Clock, Users, Activity, CheckCircle } from "lucide-react";
import { getDepartments, getDepartmentDoctors, joinQueue } from "@/lib/api";

type Step = "department" | "doctor" | "confirm" | "success";

function JoinQueueContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [step, setStep] = useState<Step>("department");
  const [departments, setDepartments] = useState<Array<{ id: string; name: string; code: string; waitingCount: number; estimatedWaitMinutes: number; activeDoctors: number }>>([]);
  const [doctors, setDoctors] = useState<Array<{ id: string; name: string; specialization: string; roomNumber: string; waitingCount: number; estimatedWaitMinutes: number }>>([]);
  const [selectedDept, setSelectedDept] = useState<{ id: string; name: string } | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<{ id: string; name: string; roomNumber: string } | null>(null);
  const [result, setResult] = useState<{ tokenDisplay: string; queueEntryId: string; patientsAhead: number; estimatedWaitMinutes: number; qrCodeDataUrl: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    getDepartments().then((res) => {
      setDepartments(res.data || []);
      setLoading(false);
      const deptParam = searchParams.get("dept");
      if (deptParam) {
        const d = res.data?.find((x) => x.id === deptParam);
        if (d) { setSelectedDept({ id: d.id, name: d.name }); setStep("doctor"); }
      }
    });
  }, [searchParams]);

  useEffect(() => {
    if (selectedDept) {
      getDepartmentDoctors(selectedDept.id).then((res) => setDoctors(res.data || []));
    }
  }, [selectedDept]);

  const handleJoin = useCallback(async () => {
    if (!selectedDept) return;
    setJoining(true); setError("");
    try {
      const res = await joinQueue({ departmentId: selectedDept.id, staffProfileId: selectedDoctor?.id });
      if (res.success && res.data) {
        setResult(res.data);
        setStep("success");
      } else {
        setError(res.error?.message || "Failed to join queue");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setJoining(false);
    }
  }, [selectedDept, selectedDoctor]);

  const filteredDepts = departments.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-border sticky top-0 z-10">
        <div className="page-container py-4 flex items-center gap-4">
          <button onClick={() => step === "department" ? router.back() : setStep(step === "doctor" ? "department" : "doctor")} className="btn-icon">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-text-main">Join Live Queue</h1>
            <p className="text-xs text-muted">
              {step === "department" ? "Select department" : step === "doctor" ? `${selectedDept?.name} · Select doctor` : "Confirm & join"}
            </p>
          </div>
        </div>
        {/* Progress */}
        <div className="flex">
          {["department", "doctor", "confirm"].map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-1 ${["department", "doctor", "confirm", "success"].indexOf(step) > i ? "bg-blue-600" : "bg-border/60"} transition-all duration-300`}
            />
          ))}
        </div>
      </div>

      <div className="page-container py-6 max-w-2xl mx-auto">

        {/* ── Step 1: Department ─────────────────────────────────────────── */}
        {step === "department" && (
          <div className="animate-fade-in-up">
            <input
              className="input mb-4"
              placeholder="Search department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDepts.map((dept) => (
                  <button
                    key={dept.id}
                    className="w-full card p-5 flex items-center justify-between hover:shadow-md transition-all text-left active:scale-[0.99]"
                    onClick={() => { setSelectedDept({ id: dept.id, name: dept.name }); setStep("doctor"); }}
                  >
                    <div>
                      <div className="font-semibold text-text-main">{dept.name}</div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> {dept.waitingCount} waiting
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> ~{dept.estimatedWaitMinutes} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5" /> {dept.activeDoctors} doctors
                        </span>
                      </div>
                    </div>
                    <span className={`badge-${dept.waitingCount > 15 ? "red" : dept.waitingCount > 8 ? "amber" : "green"} shrink-0`}>
                      {dept.waitingCount > 15 ? "Busy" : dept.waitingCount > 8 ? "Moderate" : "Available"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Doctor ─────────────────────────────────────────────── */}
        {step === "doctor" && selectedDept && (
          <div className="animate-fade-in-up space-y-3">
            <button
              className="w-full card p-5 border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-accent/10/50 transition-all text-muted hover:text-accent text-sm font-medium"
              onClick={() => { setSelectedDoctor(null); setStep("confirm"); }}
            >
              Any available doctor
            </button>
            {doctors.map((doc) => (
              <button
                key={doc.id}
                className="w-full card p-5 flex items-start justify-between hover:shadow-md transition-all text-left active:scale-[0.99]"
                onClick={() => { setSelectedDoctor({ id: doc.id, name: doc.name, roomNumber: doc.roomNumber }); setStep("confirm"); }}
              >
                <div>
                  <div className="font-bold text-text-main">{doc.name}</div>
                  <div className="text-sm text-muted mt-0.5">{doc.specialization}</div>
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {doc.roomNumber}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {doc.waitingCount} waiting
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> ~{doc.estimatedWaitMinutes} min
                    </span>
                  </div>
                </div>
                <span className="badge-green shrink-0">Available</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Step 3: Confirm ─────────────────────────────────────────────── */}
        {step === "confirm" && selectedDept && (
          <div className="card p-6 animate-fade-in-up">
            <h2 className="font-bold text-text-main mb-6">Confirm Queue Entry</h2>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Department</span>
                <span className="font-semibold text-text-main">{selectedDept.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Doctor</span>
                <span className="font-semibold text-text-main">{selectedDoctor?.name || "Any available"}</span>
              </div>
              {selectedDoctor?.roomNumber && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Room</span>
                  <span className="font-semibold text-text-main">{selectedDoctor.roomNumber}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted">Queue type</span>
                <span className="font-semibold text-text-main">Live Queue</span>
              </div>
            </div>
            {error && <div className="text-sm text-danger bg-danger/10 rounded-xl p-3 mb-4">{error}</div>}
            <button className="btn-primary w-full py-3.5" onClick={handleJoin} disabled={joining}>
              {joining ? "Joining queue..." : "Confirm & Join Queue"}
            </button>
          </div>
        )}

        {/* ── Step 4: Success ─────────────────────────────────────────────── */}
        {step === "success" && result && (
          <div className="animate-fade-in-up space-y-4">
            <div className="card p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <div className="text-success font-semibold mb-2">You're in the queue!</div>
              <div className="text-xs text-muted font-medium uppercase tracking-wide mb-2">{selectedDept?.name}</div>
              <div className="token-display mb-4">{result.tokenDisplay}</div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-background rounded-xl p-4">
                  <div className="text-2xl font-bold text-text-main">{result.patientsAhead}</div>
                  <div className="text-xs text-muted mt-1">Patients ahead</div>
                </div>
                <div className="bg-accent/10 rounded-xl p-4">
                  <div className="text-2xl font-bold text-accent">~{result.estimatedWaitMinutes}m</div>
                  <div className="text-xs text-muted mt-1">Estimated wait</div>
                </div>
              </div>
              {result.qrCodeDataUrl && (
                <div className="flex justify-center mb-6">
                  <img src={result.qrCodeDataUrl} alt="Queue QR Code" className="w-40 h-40" />
                </div>
              )}
              <div className="space-y-3">
                <Link href={`/patient/queue?id=${result.queueEntryId}`} className="btn-primary w-full">
                  View Live Queue
                </Link>
                <Link href="/patient/dashboard" className="btn-secondary w-full">
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function JoinQueuePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-muted">Loading...</div>}>
      <JoinQueueContent />
    </Suspense>
  );
}
