"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Activity, ArrowLeft, Phone, RefreshCw } from "lucide-react";
import { sendOtp, verifyOtp } from "@/lib/api";

type Step = "phone" | "otp" | "profile";

export default function AuthPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [maskedPhone, setMaskedPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [expiryCountdown, setExpiryCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    if (expiryCountdown <= 0) return;
    const t = setTimeout(() => setExpiryCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [expiryCountdown]);

  const handleSendOtp = async () => {
    if (!phone.trim()) { setError("Please enter your mobile number"); return; }
    setError(""); setLoading(true);
    try {
      const res = await sendOtp(phone.trim());
      if (res.success) {
        setMaskedPhone(res.data?.maskedPhone || "");
        setCountdown(res.data?.resendCooldownSeconds || 30);
        setExpiryCountdown(res.data?.expiresInSeconds || 300);
        setStep("otp");
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setError(res.error?.message || "Failed to send OTP");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    // Auto-submit when all filled
    if (digit && index === 5 && newOtp.every((d) => d)) {
      handleVerifyOtp(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = useCallback(async (otpValue?: string) => {
    const code = otpValue || otp.join("");
    if (code.length !== 6) { setError("Please enter the complete 6-digit OTP"); return; }
    setError(""); setLoading(true);
    try {
      const res = await verifyOtp(phone.trim(), code);
      if (res.success) {
        const user = res.data?.user;
        if (user?.role === "STAFF") { router.push("/staff"); return; }
        if (user?.role === "ADMIN") { router.push("/admin"); return; }
        if (user?.needsProfileSetup) { setStep("profile"); return; }
        router.push("/patient/dashboard");
      } else {
        setError(res.error?.message || "Invalid OTP");
        setOtp(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [otp, phone, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center">
        <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </Link>
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-xl flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">MediQueue</span>
          </div>
        </div>
        <div className="w-16" />
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* ── Phone Step ────────────────────────────────────────────────── */}
          {step === "phone" && (
            <div className="card p-8 animate-fade-in-up">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Welcome to MediQueue</h1>
                <p className="text-slate-500 text-sm mt-2">Skip the waiting room. Know your turn.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Mobile Number</label>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium shrink-0">
                      🇮🇳 +91
                    </div>
                    <input
                      id="phone-input"
                      type="tel"
                      className="input"
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                        setError("");
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                      maxLength={10}
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 rounded-xl p-3 border border-red-100">
                    {error}
                  </div>
                )}

                <button
                  id="send-otp-btn"
                  className="btn-primary w-full py-3.5"
                  onClick={handleSendOtp}
                  disabled={loading || phone.length < 10}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Sending OTP...
                    </span>
                  ) : "Send OTP"}
                </button>

                <p className="text-center text-xs text-slate-400 leading-relaxed">
                  By continuing, you agree that MediQueue uses your mobile number for
                  queue management and notifications only. No medical data is stored.
                </p>
              </div>

              {/* Demo hints */}
              <div className="mt-6 border-t border-slate-100 pt-6 grid grid-cols-3 gap-3 text-center text-xs">
                <Link href="/staff" className="card p-3 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="text-2xl mb-1">👨‍⚕️</div>
                  <div className="font-semibold text-slate-700">Staff Login</div>
                </Link>
                <Link href="/admin" className="card p-3 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="text-2xl mb-1">🏛️</div>
                  <div className="font-semibold text-slate-700">Admin</div>
                </Link>
                <Link href="/kiosk" className="card p-3 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="text-2xl mb-1">🖥️</div>
                  <div className="font-semibold text-slate-700">Kiosk</div>
                </Link>
              </div>
            </div>
          )}

          {/* ── OTP Step ──────────────────────────────────────────────────── */}
          {step === "otp" && (
            <div className="card p-8 animate-fade-in-up">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📩</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Verify your number</h1>
                <p className="text-slate-500 text-sm mt-2">
                  OTP sent to <span className="font-semibold text-slate-700">{maskedPhone}</span>
                </p>
                {expiryCountdown > 0 && (
                  <p className="text-xs text-slate-400 mt-1">
                    Expires in {Math.floor(expiryCountdown / 60)}:{String(expiryCountdown % 60).padStart(2, "0")}
                  </p>
                )}
              </div>

              {/* Dev OTP hint */}
              {devOtp && (
                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                  <div className="text-xs font-semibold text-amber-700 mb-1">🧪 Demo Environment</div>
                  <div className="text-2xl font-mono font-bold text-amber-800 tracking-widest">{devOtp}</div>
                  <div className="text-xs text-amber-600 mt-1">Use this OTP (only shown in demo mode)</div>
                </div>
              )}

              {/* OTP Input */}
              <div className="flex justify-center gap-2 mb-6">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    className="otp-input"
                    value={digit}
                    placeholder="·"
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    maxLength={1}
                  />
                ))}
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 rounded-xl p-3 border border-red-100 mb-4">
                  {error}
                </div>
              )}

              <button
                id="verify-otp-btn"
                className="btn-primary w-full py-3.5 mb-4"
                onClick={() => handleVerifyOtp()}
                disabled={loading || otp.some((d) => !d)}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Verifying...
                  </span>
                ) : "Verify OTP"}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  className="text-slate-500 hover:text-slate-700 flex items-center gap-1"
                  onClick={() => { setStep("phone"); setOtp(["", "", "", "", "", ""]); setError(""); }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Change number
                </button>
                <button
                  className={`flex items-center gap-1 text-primary font-semibold ${countdown > 0 ? "opacity-50 cursor-not-allowed" : "hover:underline"}`}
                  disabled={countdown > 0}
                  onClick={() => { setOtp(["", "", "", "", "", ""]); handleSendOtp(); }}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                </button>
              </div>
            </div>
          )}

          {/* ── Profile Step ──────────────────────────────────────────────── */}
          {step === "profile" && <ProfileSetup onComplete={() => router.push("/patient/dashboard")} />}

        </div>
      </main>
    </div>
  );
}

function ProfileSetup({ onComplete }: { onComplete: () => void }) {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Full name is required"); return; }
    if (!consent) { setError("Please agree to the privacy policy"); return; }
    setLoading(true);
    try {
      const { setupProfile } = await import("@/lib/api");
      const res = await setupProfile({ fullName: name.trim(), dateOfBirth: dob || undefined, gender: gender || undefined, consentGiven: true });
      if (res.success) {
        onComplete();
      } else {
        setError("Profile setup failed. Please try again.");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-8 animate-fade-in-up">
      <div className="text-center mb-8">
        <div className="text-4xl mb-4">👤</div>
        <h1 className="text-2xl font-bold text-slate-900">Complete your profile</h1>
        <p className="text-slate-500 text-sm mt-2">This takes less than a minute</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-1 block">Full Name *</label>
          <input className="input" placeholder="e.g. Arjun Sharma" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-1 block">Date of Birth (optional)</label>
          <input type="date" className="input" value={dob} onChange={(e) => setDob(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-1 block">Gender (optional)</label>
          <select className="input" value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">Prefer not to say</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-800">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-primary" />
            <span>
              MediQueue uses your mobile number and appointment information to manage your hospital
              queue and send queue notifications. No medical history is stored.
            </span>
          </label>
        </div>
        {error && <div className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{error}</div>}
        <button className="btn-primary w-full py-3.5" onClick={handleSubmit} disabled={loading}>
          {loading ? "Saving..." : "Continue to Dashboard"}
        </button>
      </div>
    </div>
  );
}
