"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Activity, ArrowLeft, Phone, Mail, RefreshCw, X } from "lucide-react";
import { sendOtp, verifyOtp, setupProfile } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

type Step = "phone" | "otp" | "profile";
type AuthMethod = "phone" | "email";

export default function AuthPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [step, setStep] = useState<Step>("phone");
  const [method, setMethod] = useState<AuthMethod>("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [maskedPhone, setMaskedPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [expiryCountdown, setExpiryCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [showDemoModal, setShowDemoModal] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(interval);
  }, [countdown]);

  useEffect(() => {
    if (expiryCountdown <= 0) return;
    const interval = setTimeout(() => setExpiryCountdown((c) => c - 1), 1000);
    return () => clearTimeout(interval);
  }, [expiryCountdown]);

  const handleSendOtp = async () => {
    if (method === "phone" && !phone.trim()) { setError("Please enter your mobile number"); return; }
    if (method === "email" && (!email.trim() || !email.includes("@"))) { setError("Please enter a valid email address"); return; }
    setError(""); setLoading(true);
    try {
      const identifier = method === "email" ? email.trim() : phone.trim();
      const res = await sendOtp(method, identifier);
      if (res.success) {
        setMaskedPhone(res.data?.maskedPhone || "");
        setCountdown(res.data?.resendCooldownSeconds || 30);
        setExpiryCountdown(res.data?.expiresInSeconds || 300);
        
        if (res.data?.demoOtp) {
          setDevOtp(res.data.demoOtp);
          setShowDemoModal(true);
        } else {
          setDevOtp(null);
        }

        setStep("otp");
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setError(res.error?.message || "Failed to send OTP");
      }
    } catch {
      setError(t("common.error"));
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
      const identifier = method === "email" ? email.trim() : phone.trim();
      const res = await verifyOtp(method, identifier, code);
      if (res.success) {
        setShowDemoModal(false);
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
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [otp, method, email, phone, router, t]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/5 via-surface to-primary/5 flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex-1">
          <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-text-main transition-colors focus:outline-none focus:ring-2 focus:ring-accent rounded-lg px-2 py-1">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">{t("common.back")}</span>
          </Link>
        </div>
        <div className="flex-1 flex justify-center">
          <Link href="/" className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-accent rounded-lg px-2 py-1">
            <img src="/logo.svg" alt={t("app.title")} className="h-10 dark:brightness-110" />
          </Link>
        </div>
        <div className="flex-1 flex justify-end gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-6 relative">
        <div className="w-full max-w-md">
          {step === "phone" && (
            <div className="card p-8 animate-fade-in-up">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-border/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {method === "phone" ? <Phone className="w-8 h-8 text-primary" /> : <Mail className="w-8 h-8 text-primary" />}
                </div>
                <h1 className="text-2xl font-bold text-text-main">Welcome to {t("app.title")}</h1>
                <p className="text-muted text-sm mt-2">{t("app.tagline")}</p>
              </div>

              <div className="flex bg-border/30 p-1 rounded-xl mb-6">
                <button
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary ${method === "phone" ? "bg-surface text-text-main shadow-sm" : "text-muted hover:text-text-main"}`}
                  onClick={() => { setMethod("phone"); setError(""); }}
                >
                  {t("auth.method.mobile")}
                </button>
                <button
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary ${method === "email" ? "bg-surface text-text-main shadow-sm" : "text-muted hover:text-text-main"}`}
                  onClick={() => { setMethod("email"); setError(""); }}
                >
                  {t("auth.method.email")}
                </button>
              </div>

              <div className="space-y-4">
                {method === "phone" ? (
                  <div>
                    <label className="text-sm font-semibold text-text-main mb-2 block">{t("auth.mobile.label")}</label>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-2 px-3 bg-background border border-border rounded-xl text-sm text-muted font-medium shrink-0">
                        🇮🇳 +91
                      </div>
                      <input
                        id="phone-input"
                        type="tel"
                        className="input"
                        placeholder={t("auth.mobile.placeholder")}
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
                ) : (
                  <div>
                    <label className="text-sm font-semibold text-text-main mb-2 block">{t("auth.email.label")}</label>
                    <input
                      id="email-input"
                      type="email"
                      className="input w-full"
                      placeholder={t("auth.email.placeholder")}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                      autoFocus
                    />
                  </div>
                )}

                {error && (
                  <div className="text-sm text-danger bg-danger/10 rounded-xl p-3 border border-danger/20">
                    {error}
                  </div>
                )}

                <button
                  id="send-otp-btn"
                  className="btn-primary w-full py-3.5"
                  onClick={handleSendOtp}
                  disabled={loading || (method === "phone" ? phone.length < 10 : !email.includes("@"))}
                >
                  {loading ? (
                    <span className="flex items-center gap-2 justify-center">
                      <RefreshCw className="w-4 h-4 animate-spin" /> {t("common.loading")}
                    </span>
                  ) : t("auth.getOtp")}
                </button>

                <p className="text-center text-xs text-muted leading-relaxed">
                  {t("auth.consent")}
                </p>
              </div>

              {/* Demo hints */}
              <div className="mt-6 border-t border-border/50 pt-6 grid grid-cols-3 gap-3 text-center text-xs">
                <Link href="/staff" className="card p-3 hover:bg-background transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary rounded-xl">
                  <div className="text-2xl mb-1">👨‍⚕️</div>
                  <div className="font-semibold text-text-main">Staff Login</div>
                </Link>
                <Link href="/admin" className="card p-3 hover:bg-background transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary rounded-xl">
                  <div className="text-2xl mb-1">🏛️</div>
                  <div className="font-semibold text-text-main">Admin</div>
                </Link>
                <Link href="/kiosk" className="card p-3 hover:bg-background transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary rounded-xl">
                  <div className="text-2xl mb-1">🖥️</div>
                  <div className="font-semibold text-text-main">Kiosk</div>
                </Link>
              </div>
            </div>
          )}

          {step === "otp" && (
            <div className="card p-8 animate-fade-in-up">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📩</span>
                </div>
                <h1 className="text-2xl font-bold text-text-main">{t("auth.verifyOtp")}</h1>
                <p className="text-muted text-sm mt-2">
                  OTP sent to <span className="font-semibold text-text-main">{maskedPhone}</span>
                </p>
                {expiryCountdown > 0 && (
                  <p className="text-xs text-muted mt-1">
                    Expires in {Math.floor(expiryCountdown / 60)}:{String(expiryCountdown % 60).padStart(2, "0")}
                  </p>
                )}
              </div>

              {/* OTP Input */}
              <div className="flex justify-center gap-2 mb-6" dir="ltr">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    className="otp-input w-12 h-14 text-center text-xl font-bold rounded-xl border-border focus:border-primary focus:ring-primary"
                    value={digit}
                    placeholder="·"
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    maxLength={1}
                  />
                ))}
              </div>

              {error && (
                <div className="text-sm text-danger bg-danger/10 rounded-xl p-3 border border-danger/20 mb-4">
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
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" /> {t("common.loading")}
                  </span>
                ) : t("auth.verifyOtp")}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  className="text-muted hover:text-text-main flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1"
                  onClick={() => { setStep("phone"); setOtp(["", "", "", "", "", ""]); setError(""); }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> {t("common.back")}
                </button>
                <button
                  className={`flex items-center gap-1 text-primary font-semibold focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1 ${countdown > 0 ? "opacity-50 cursor-not-allowed" : "hover:underline"}`}
                  disabled={countdown > 0}
                  onClick={() => { setOtp(["", "", "", "", "", ""]); handleSendOtp(); }}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {countdown > 0 ? `Resend in ${countdown}s` : t("auth.resend")}
                </button>
              </div>
            </div>
          )}

          {step === "profile" && <ProfileSetup onComplete={() => router.push("/patient/dashboard")} t={t} />}
        </div>
      </main>

      {/* Demo OTP Modal */}
      {showDemoModal && devOtp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div 
            className="bg-surface rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-modal-title"
          >
            <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex justify-between items-center">
              <h3 id="demo-modal-title" className="text-amber-800 font-bold flex items-center gap-2">
                <span className="text-xl">🧪</span> {t("auth.demo.title")}
              </h3>
              <button 
                onClick={() => setShowDemoModal(false)}
                className="text-amber-600 hover:text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded p-1"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 text-center">
              <p className="text-muted text-sm mb-4">Your verification code</p>
              <div className="text-4xl font-mono font-bold tracking-widest text-text-main mb-6 bg-background py-4 rounded-xl border border-border/50" dir="ltr">
                {devOtp.split('').join(' ')}
              </div>
              <div className="flex items-center justify-between text-sm text-muted mb-6 px-4">
                <span>Expires in</span>
                <span className="font-mono font-medium text-amber-600">
                  {Math.floor(expiryCountdown / 60)}:{String(expiryCountdown % 60).padStart(2, "0")}
                </span>
              </div>
              <button
                onClick={() => {
                  setOtp(devOtp.split(''));
                  setShowDemoModal(false);
                  setTimeout(() => handleVerifyOtp(devOtp), 50);
                }}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              >
                {t("auth.demo.useCode")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileSetup({ onComplete, t }: { onComplete: () => void, t: (key: string) => string }) {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) return setError("Full name is required");
    if (!consent) return setError("Consent is required");

    setLoading(true);
    try {
      const res = await setupProfile({
        fullName: name,
        dateOfBirth: dob || undefined,
        gender: gender || undefined,
        consentGiven: consent,
      });
      if (res.success) {
        onComplete();
      } else {
        setError(res.error?.message || "Failed to setup profile");
      }
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-8 animate-fade-in-up">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-text-main">Complete Profile</h2>
        <p className="text-muted text-sm mt-2">Just a few details to get started.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-text-main mb-1 block">Full Name *</label>
          <input type="text" className="input" placeholder="Rahul Kumar" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-semibold text-text-main mb-1 block">Date of Birth (Optional)</label>
          <input type="date" className="input" value={dob} onChange={e => setDob(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-semibold text-text-main mb-1 block">Gender (Optional)</label>
          <select className="input" value={gender} onChange={e => setGender(e.target.value)}>
            <option value="">Select Gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
            <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
          </select>
        </div>

        <label className="flex items-start gap-3 p-3 bg-background rounded-xl border border-border mt-4 cursor-pointer focus-within:ring-2 focus-within:ring-primary">
          <input type="checkbox" className="mt-1 w-4 h-4 text-primary focus:ring-primary rounded border-slate-300" checked={consent} onChange={e => setConsent(e.target.checked)} />
          <span className="text-xs text-muted">
            I consent to MediQueue storing my personal details for hospital queue management and appointment scheduling.
          </span>
        </label>

        {error && <div className="text-sm text-danger bg-danger/10 rounded-xl p-3 border border-danger/20">{error}</div>}

        <button className="btn-primary w-full py-3.5 mt-2" onClick={handleSubmit} disabled={loading || !name.trim() || !consent}>
          {loading ? t("common.loading") : "Continue"}
        </button>
      </div>
    </div>
  );
}
