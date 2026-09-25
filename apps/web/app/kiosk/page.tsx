"use client";
import { useState, useEffect } from "react";
import { Activity, CheckCircle, ArrowLeft } from "lucide-react";
import { getDepartments, getDepartmentDoctors, joinQueue, sendOtp, verifyOtp } from "@/lib/api";

type KioskStep = "phone" | "otp" | "department" | "doctor" | "success";

export default function KioskPage() {
  const [step, setStep] = useState<KioskStep>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [departments, setDepartments] = useState<Array<{ id: string; name: string; waitingCount: number; estimatedWaitMinutes: number }>>([]);
  const [doctors, setDoctors] = useState<Array<{ id: string; name: string; roomNumber: string; waitingCount: number; estimatedWaitMinutes: number }>>([]);
  const [selectedDept, setSelectedDept] = useState<{ id: string; name: string } | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<{ id: string; name: string } | null>(null);
  const [result, setResult] = useState<{ tokenDisplay: string; estimatedWaitMinutes: number; patientsAhead: number; qrCodeDataUrl: string } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getDepartments().then((r) => setDepartments(r.data || []));
  }, []);

  useEffect(() => {
    if (selectedDept) getDepartmentDoctors(selectedDept.id).then((r) => setDoctors(r.data || []));
  }, [selectedDept]);

  async function handleSendOtp() {
    if (phone.length < 10) { setError("Enter a valid 10-digit number"); return; }
    setLoading(true); setError("");
    const res = await sendOtp(phone);
    if (res.success) {
      const r = res as typeof res & { devOtp?: string };
      if (r.devOtp) setDevOtp(r.devOtp);
      setStep("otp");
    } else {
      setError(res.error?.message || "Failed to send OTP");
    }
    setLoading(false);
  }

  async function handleVerifyOtp() {
    if (otp.length !== 6) { setError("Enter the 6-digit OTP"); return; }
    setLoading(true); setError("");
    const res = await verifyOtp(phone, otp);
    if (res.success) { setStep("department"); }
    else { setError(res.error?.message || "Invalid OTP"); }
    setLoading(false);
  }

  async function handleJoin() {
    if (!selectedDept) return;
    setLoading(true); setError("");
    const res = await joinQueue({ departmentId: selectedDept.id, staffProfileId: selectedDoctor?.id, isWalkIn: true });
    if (res.success && res.data) { setResult(res.data); setStep("success"); }
    else { setError(res.error?.message || "Failed to join queue"); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      {/* Header */}
      <header className="p-8 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="text-white text-2xl font-extrabold">MediQueue</div>
            <div className="text-blue-200 text-sm">Walk-in Kiosk</div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">

          {/* ── Phone ─────────────────────────────────────────────────────── */}
          {step === "phone" && (
            <div className="bg-white rounded-3xl p-8 shadow-2xl animate-fade-in-up">
              <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-2">Welcome</h2>
              <p className="text-slate-500 text-center mb-8">Enter your mobile number to get started</p>
              <div className="mb-6">
                <div className="text-slate-500 text-sm font-medium mb-2">Mobile Number</div>
                <div className="flex gap-2">
                  <div className="flex items-center px-4 bg-slate-100 border border-slate-200 rounded-2xl text-slate-600 font-semibold text-lg shrink-0">
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    className="flex-1 px-4 py-4 text-2xl font-bold border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 text-center tracking-widest"
                    placeholder="XXXXXXXXXX"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setError(""); }}
                    maxLength={10}
                    autoFocus
                  />
                </div>
              </div>
              {error && <div className="text-red-600 bg-red-50 rounded-xl p-4 mb-4 text-sm text-center">{error}</div>}
              <button
                className="w-full bg-primary hover:bg-slate-800 text-white text-xl font-bold py-5 rounded-2xl transition-colors disabled:opacity-50"
                onClick={handleSendOtp}
                disabled={loading || phone.length < 10}
              >
                {loading ? "Sending OTP..." : "Get OTP →"}
              </button>
            </div>
          )}

          {/* ── OTP ───────────────────────────────────────────────────────── */}
          {step === "otp" && (
            <div className="bg-white rounded-3xl p-8 shadow-2xl animate-fade-in-up">
              <button className="flex items-center gap-2 text-slate-500 mb-6 hover:text-slate-700" onClick={() => setStep("phone")}>
                <ArrowLeft className="w-5 h-5" /> Back
              </button>
              <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-2">Enter OTP</h2>
              <p className="text-slate-500 text-center mb-6">Sent to +91 ****{phone.slice(-4)}</p>
              {devOtp && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center mb-6">
                  <div className="text-amber-700 font-semibold text-sm">Demo OTP</div>
                  <div className="text-4xl font-mono font-bold text-amber-800 tracking-widest">{devOtp}</div>
                </div>
              )}
              <input
                type="text"
                inputMode="numeric"
                className="w-full text-center text-4xl font-mono font-bold border-2 border-slate-200 rounded-2xl py-4 mb-6 focus:outline-none focus:border-blue-500 tracking-[0.5em]"
                placeholder="------"
                maxLength={6}
                value={otp}
                onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
              />
              {error && <div className="text-red-600 bg-red-50 rounded-xl p-4 mb-4 text-sm text-center">{error}</div>}
              <button
                className="w-full bg-primary hover:bg-slate-800 text-white text-xl font-bold py-5 rounded-2xl transition-colors disabled:opacity-50"
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
              >
                {loading ? "Verifying..." : "Verify OTP →"}
              </button>
            </div>
          )}

          {/* ── Department ────────────────────────────────────────────────── */}
          {step === "department" && (
            <div className="bg-white rounded-3xl p-8 shadow-2xl animate-fade-in-up">
              <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-6">Choose Department</h2>
              <div className="space-y-3">
                {departments.map((dept) => (
                  <button
                    key={dept.id}
                    className="w-full flex items-center justify-between p-5 rounded-2xl border-2 border-slate-200 hover:border-primary hover:bg-slate-50 transition-all text-left active:scale-[0.99]"
                    onClick={() => { setSelectedDept({ id: dept.id, name: dept.name }); setStep("doctor"); }}
                  >
                    <div>
                      <div className="text-xl font-bold text-slate-900">{dept.name}</div>
                      <div className="text-slate-500 text-sm mt-1">
                        {dept.waitingCount} waiting · ~{dept.estimatedWaitMinutes} min
                      </div>
                    </div>
                    <div className="text-primary text-2xl">→</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Doctor ────────────────────────────────────────────────────── */}
          {step === "doctor" && selectedDept && (
            <div className="bg-white rounded-3xl p-8 shadow-2xl animate-fade-in-up">
              <button className="flex items-center gap-2 text-slate-500 mb-4 hover:text-slate-700" onClick={() => setStep("department")}>
                <ArrowLeft className="w-5 h-5" /> {selectedDept.name}
              </button>
              <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-6">Choose Doctor</h2>
              <div className="space-y-3">
                <button
                  className="w-full flex items-center justify-between p-5 rounded-2xl border-2 border-dashed border-slate-300 hover:border-primary hover:bg-slate-50 transition-all"
                  onClick={() => { setSelectedDoctor(null); handleJoin(); }}
                >
                  <div>
                    <div className="text-xl font-bold text-slate-700">Any Available Doctor</div>
                    <div className="text-slate-400 text-sm">Assigned automatically</div>
                  </div>
                  <div className="text-primary text-2xl">→</div>
                </button>
                {doctors.map((doc) => (
                  <button
                    key={doc.id}
                    className="w-full flex items-center justify-between p-5 rounded-2xl border-2 border-slate-200 hover:border-primary hover:bg-slate-50 transition-all text-left"
                    onClick={() => { setSelectedDoctor({ id: doc.id, name: doc.name }); handleJoin(); }}
                  >
                    <div>
                      <div className="text-xl font-bold text-slate-900">{doc.name}</div>
                      <div className="text-slate-500 text-sm mt-0.5">{doc.roomNumber} · {doc.waitingCount} waiting · ~{doc.estimatedWaitMinutes}m</div>
                    </div>
                    <div className="text-primary text-2xl">→</div>
                  </button>
                ))}
              </div>
              {error && <div className="text-red-600 bg-red-50 rounded-xl p-4 mt-4 text-sm text-center">{error}</div>}
              {loading && <div className="text-center text-slate-500 mt-4">Joining queue...</div>}
            </div>
          )}

          {/* ── Success ───────────────────────────────────────────────────── */}
          {step === "success" && result && (
            <div className="bg-white rounded-3xl p-8 shadow-2xl animate-fade-in-up text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-3xl font-extrabold text-slate-900 mb-2">You're in the queue!</h2>
              <div className="text-slate-500 mb-6">{selectedDept?.name}</div>

              <div className="font-mono text-7xl font-extrabold text-primary mb-4">
                {result.tokenDisplay}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 rounded-2xl p-4">
                  <div className="text-3xl font-bold text-slate-800">{result.patientsAhead}</div>
                  <div className="text-sm text-slate-500">Patients ahead</div>
                </div>
                <div className="bg-slate-100 rounded-2xl p-4">
                  <div className="text-3xl font-bold text-primary">~{result.estimatedWaitMinutes}m</div>
                  <div className="text-sm text-slate-500">Estimated wait</div>
                </div>
              </div>

              {result.qrCodeDataUrl && (
                <div className="flex justify-center mb-6">
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <img src={result.qrCodeDataUrl} alt="QR Code" className="w-48 h-48" />
                    <div className="text-xs text-slate-400 mt-2">Scan to track your queue</div>
                  </div>
                </div>
              )}

              <div className="text-slate-500 text-sm mb-6">
                Please remember your token number and proceed to the waiting area.
              </div>

              <button
                className="w-full bg-primary hover:bg-slate-800 text-white text-xl font-bold py-5 rounded-2xl transition-colors"
                onClick={() => { setStep("phone"); setPhone(""); setOtp(""); setResult(null); setSelectedDept(null); setSelectedDoctor(null); }}
              >
                Done (New Patient)
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
