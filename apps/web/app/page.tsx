import Link from "next/link";
import { Activity, Bell, Clock, CheckCircle, Users, Shield, Zap, ArrowRight } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-100">
        <div className="page-container py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900">MediQueue</span>
          </div>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="#how-it-works" className="hover:text-slate-900 transition-colors">How it works</Link>
            <Link href="#features" className="hover:text-slate-900 transition-colors">Features</Link>
            <span className="text-slate-300">|</span>
            <Link href="/staff" className="hover:text-slate-900 transition-colors">For Staff</Link>
            <Link href="/admin" className="hover:text-slate-900 transition-colors">Admin</Link>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/auth" className="btn-ghost text-sm">Login</Link>
            <Link href="/auth" className="btn-primary text-sm">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 pointer-events-none" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
        <div className="absolute bottom-0 left-20 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-30 pointer-events-none" />

        <div className="page-container relative py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="badge-blue mb-6 w-fit">
              🏥 OPD Queue Intelligence Platform
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-slate-900 mb-6">
              Know your turn{" "}
              <span className="text-primary relative">
                before
                <span className="absolute bottom-0 left-0 w-full h-1 bg-slate-200 rounded" />
              </span>
              {" "}you reach the hospital.
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed mb-10 max-w-xl">
              Book an OPD slot, join a live queue remotely and track your estimated waiting time in real time — from anywhere.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/auth" className="btn-primary text-base px-8 py-3.5">
                Join a Queue <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/auth" className="btn-outline text-base px-8 py-3.5">
                Book Appointment
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 pt-8 border-t border-slate-100">
              {[
                { label: "Patients Today", value: "148+" },
                { label: "Avg Wait Saved", value: "31 min" },
                { label: "Departments", value: "3 live" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-3xl font-extrabold text-primary">{s.value}</div>
                  <div className="text-sm text-slate-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero card mockup */}
          <div className="absolute right-8 top-16 hidden xl:block">
            <div className="card-elevated p-6 w-72 animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs text-slate-500 font-medium">CARDIOLOGY</div>
                  <div className="font-semibold text-slate-800">Dr. Ananya Sen</div>
                </div>
                <span className="badge-green">Active</span>
              </div>
              <div className="text-center py-4 bg-slate-50 rounded-xl mb-4 border border-slate-100">
                <div className="token-display text-4xl text-primary">C-024</div>
                <div className="text-xs text-slate-500 mt-1">Your Token</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                  <div className="text-2xl font-bold text-slate-800">12</div>
                  <div className="text-xs text-slate-500">Patients ahead</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                  <div className="text-2xl font-bold text-primary">~36m</div>
                  <div className="text-xs text-slate-500">Est. wait</div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-amber-600 font-semibold bg-amber-50 rounded-xl p-3">
                <Bell className="w-4 h-4" />
                3 patients away — please be ready!
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-slate-50">
        <div className="page-container">
          <div className="text-center mb-16">
            <h2 className="mb-3">How MediQueue works</h2>
            <p className="text-slate-500 text-lg">From registration to consultation in 6 simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { icon: "📱", step: "1", title: "Register", desc: "Mobile + OTP" },
              { icon: "🏥", step: "2", title: "Select", desc: "Dept & Doctor" },
              { icon: "🎫", step: "3", title: "Join Queue", desc: "Get token + QR" },
              { icon: "📍", step: "4", title: "Track Live", desc: "Real-time position" },
              { icon: "🔔", step: "5", title: "Get Notified", desc: "3 turns away" },
              { icon: "✅", step: "6", title: "Consult", desc: "Your turn!" },
            ].map((item) => (
              <div key={item.step} className="card p-5 text-center animate-fade-in-up hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{item.icon}</div>
                <div className="w-6 h-6 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center mx-auto mb-2">
                  {item.step}
                </div>
                <div className="font-semibold text-slate-800 text-sm">{item.title}</div>
                <div className="text-xs text-slate-500 mt-1">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section id="features" className="py-24">
        <div className="page-container">
          <div className="text-center mb-16">
            <h2 className="mb-3">Everything your hospital needs</h2>
            <p className="text-slate-500 text-lg">Patient experience + Staff efficiency + Admin intelligence</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Clock className="w-6 h-6 text-blue-600" />,
                title: "Real-time Queue Tracking",
                desc: "Patients see their live position, token number, and estimated wait time — updated in real time via WebSockets.",
              },
              {
                icon: <Bell className="w-6 h-6 text-amber-600" />,
                title: "Smart Notifications",
                desc: "3-turn-away alerts, your-turn notifications, and consultation updates delivered instantly.",
              },
              {
                icon: <CheckCircle className="w-6 h-6 text-green-600" />,
                title: "Staff Queue Control",
                desc: "Call next, skip, mark no-show, start and complete consultations with a single click.",
              },
              {
                icon: <Activity className="w-6 h-6 text-purple-600" />,
                title: "Wait-time Prediction",
                desc: "Intelligent estimates using historical service data. Shows confidence range and explains every factor.",
              },
              {
                icon: <Zap className="w-6 h-6 text-orange-600" />,
                title: "Bottleneck Detection",
                desc: "Admin sees when arrival rate exceeds service rate and gets actionable staffing recommendations.",
              },
              {
                icon: <Users className="w-6 h-6 text-blue-600" />,
                title: "Priority Queue",
                desc: "Emergency, pregnancy, and elderly patients handled with hospital-defined priority rules — never just by self-selection.",
              },
              {
                icon: <Shield className="w-6 h-6 text-green-600" />,
                title: "Privacy by Design",
                desc: "Minimal data collection. QR codes contain no personal information. JWT authentication with RBAC.",
              },
              {
                icon: <Activity className="w-6 h-6 text-blue-600" />,
                title: "Admin Analytics",
                desc: "Queue trends, department load comparison, wait time distributions, and what-if simulation.",
              },
              {
                icon: <Clock className="w-6 h-6 text-slate-600" />,
                title: "Walk-in Kiosk",
                desc: "Large-button touchscreen interface for patients without smartphones — accessible at /kiosk.",
              },
            ].map((f) => (
              <div key={f.title} className="card p-6 hover:shadow-md transition-shadow duration-200">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-primary">
        <div className="page-container text-center text-white">
          <h2 className="text-white mb-4">Ready to transform your OPD?</h2>
          <p className="text-slate-300 text-lg mb-10">
            MediQueue doesn't just manage the queue. It makes the waiting room predictable.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/auth" className="bg-white text-primary hover:bg-slate-50 font-semibold px-8 py-3.5 rounded-xl transition-colors inline-flex items-center gap-2 shadow-sm">
              Patient Portal <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/staff" className="border border-white/20 text-white hover:bg-white/5 font-semibold px-8 py-3.5 rounded-xl transition-colors inline-flex items-center gap-2">
              Staff Login
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="py-8 border-t border-slate-100 bg-white">
        <div className="page-container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-slate-600">MediQueue</span>
            <span>— Smart OPD Queue Intelligence Platform</span>
          </div>
          <div>
            Built for <span className="text-primary font-medium">CodeVoyage HT-01</span> · Synthetic data only
          </div>
        </div>
      </footer>
    </div>
  );
}
