"use client";

import Link from "next/link";
import { Activity, Bell, Clock, CheckCircle, Users, Shield, Zap, ArrowRight, ActivitySquare, ShieldCheck, Hospital, Keyboard, Globe } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useI18n } from "@/lib/i18n";

export default function LandingPage() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-surface">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur border-b border-border/50">
        <div className="page-container py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="MediQueue" className="h-10 dark:brightness-110" />
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted">
            <Link href="#how-it-works" className="hover:text-text-main transition-colors focus:outline-none focus:ring-2 focus:ring-accent rounded-md px-1">{t("landing.nav.howItWorks")}</Link>
            <Link href="#features" className="hover:text-text-main transition-colors focus:outline-none focus:ring-2 focus:ring-accent rounded-md px-1">{t("landing.nav.features")}</Link>
            <span className="text-border">|</span>
            <Link href="/staff" className="hover:text-text-main transition-colors focus:outline-none focus:ring-2 focus:ring-accent rounded-md px-1">{t("landing.nav.staff")}</Link>
            <Link href="/admin" className="hover:text-text-main transition-colors focus:outline-none focus:ring-2 focus:ring-accent rounded-md px-1">{t("landing.nav.admin")}</Link>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <Link href="/auth" className="btn-ghost hidden sm:inline-flex text-sm">{t("landing.nav.login")}</Link>
            <Link href="/auth" className="btn-primary text-sm shadow-sm">
              {t("landing.nav.getStarted")} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-24 md:pt-24 md:pb-32">
        {/* Background gradient elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-surface to-primary/5 pointer-events-none" />
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[100px] opacity-40 pointer-events-none" />
        <div className="absolute bottom-0 left-20 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[80px] opacity-30 pointer-events-none" />

        <div className="page-container relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-bold mb-8 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                {t("landing.hero.badge")}
              </div>
              <h1 className="text-5xl md:text-6xl font-black leading-[1.15] text-text-main mb-6 tracking-tight">
                {t("landing.hero.title1")}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent relative">
                  {t("landing.hero.title2")}
                </span>
                <br />{t("landing.hero.title3")}
              </h1>
              <p className="text-xl text-muted leading-relaxed mb-10 max-w-xl">
                {t("landing.hero.subtitle")}
                Experience a predictable, stress-free hospital visit.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/auth" className="btn-primary text-base px-8 py-4 shadow-lg shadow-primary/20">
                  Join a Queue <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/auth" className="btn-outline bg-surface text-base px-8 py-4">
                  Book Appointment
                </Link>
              </div>

              {/* Trust Metrics */}
              <div className="mt-16 grid grid-cols-3 gap-8 pt-8 border-t border-border/50">
                {[
                  { label: "Patients Today", value: "1,248+" },
                  { label: "Avg Wait Saved", value: "45 min" },
                  { label: "Live Facilities", value: "12+" },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="text-3xl font-extrabold text-primary">{s.value}</div>
                    <div className="text-sm text-muted mt-1 font-medium">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content - Visual Mockup */}
            <div className="relative hidden lg:block h-[600px] w-full flex-col justify-center animate-fade-in-up">
              {/* Floating Badge */}
              <div className="absolute -top-6 -right-6 z-20 bg-surface/80 backdrop-blur border border-border shadow-lg rounded-xl px-4 py-2 font-mono text-xs text-muted flex items-center gap-2 animate-bounce">
                <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                LIVE QUEUE PREVIEW
              </div>
              
              <div className="relative w-full max-w-md mx-auto ml-auto mr-0">
                {/* Main Card */}
                <div className="card-elevated shadow-2xl shadow-accent/10 border-border/60 overflow-hidden relative z-10">
                  <div className="bg-primary/5 p-6 border-b border-border/50">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs text-muted font-bold tracking-wider">CARDIOLOGY</div>
                      <span className="badge-green">Active</span>
                    </div>
                    <div className="font-bold text-lg text-text-main">Dr. Ananya Sen</div>
                    <div className="text-sm text-muted">City Heart Hospital</div>
                  </div>
                  
                  <div className="p-6">
                    <div className="text-center py-6 bg-background rounded-2xl mb-6 border border-border/50 shadow-inner">
                      <div className="token-display text-5xl text-primary mb-1">C-024</div>
                      <div className="text-xs font-semibold text-muted tracking-widest uppercase">Example Token</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-background rounded-2xl p-4 text-center border border-border/50">
                        <div className="text-3xl font-black text-text-main mb-1">12</div>
                        <div className="text-xs font-medium text-muted">Patients ahead</div>
                      </div>
                      <div className="bg-background rounded-2xl p-4 text-center border border-border/50">
                        <div className="text-3xl font-black text-text-main mb-1">~36<span className="text-lg">m</span></div>
                        <div className="text-xs font-medium text-muted">Estimated wait</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-accent">Queue Progress</span>
                        <span className="text-muted">65%</span>
                      </div>
                      <div className="queue-progress h-2.5">
                        <div className="queue-progress-fill w-[65%]" />
                      </div>
                    </div>
                    
                    <div className="notification-3away rounded-xl p-4 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
                        <Bell className="w-4 h-4 text-warning" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-warning-700 dark:text-warning mb-0.5">You're getting closer</div>
                        <div className="text-xs text-warning-600 dark:text-warning/80">Please prepare to proceed to Room 204.</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Decorative background cards */}
                <div className="absolute -bottom-8 -left-8 w-64 h-32 bg-surface border border-border rounded-2xl shadow-lg -z-10 opacity-70 transform -rotate-6" />
                <div className="absolute top-20 -right-12 w-48 h-64 bg-surface border border-border rounded-2xl shadow-lg -z-10 opacity-50 transform rotate-12" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust / Product Strip ──────────────────────────────────────────── */}
      <section className="border-y border-border/50 bg-background/50 relative z-20">
        <div className="page-container py-10">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
            {[
              { icon: ActivitySquare, title: "Real-time Updates" },
              { icon: ShieldCheck, title: "Secure & Private" },
              { icon: Hospital, title: "Multiple Facilities" },
              { icon: Globe, title: "22 Indian Languages" },
              { icon: Keyboard, title: "Accessible by Keyboard" },
              { icon: Zap, title: "Live Queue Intelligence" }
            ].map((feature, i) => (
              <div key={i} className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl hover:bg-surface border border-transparent hover:border-border transition-all duration-300">
                <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                  <feature.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-text-main">{feature.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Facility Visuals ───────────────────────────────────────────────── */}
      <section id="facilities" className="section bg-surface py-24">
        <div className="page-container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4">Supported Facilities</h2>
            <p className="text-muted">
              Connect with leading healthcare providers using MediQueue's smart OPD system.
              (Note: The facilities below are synthetic examples for demonstration.)
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "City Heart Hospital", type: "Multispecialty", wait: "~25m", queue: "Live", depts: 4 },
              { name: "Apex Nursing Home", type: "General", wait: "~15m", queue: "Live", depts: 2 },
              { name: "Metro OPD Centre", type: "Clinic", wait: "~45m", queue: "High Load", depts: 6 }
            ].map((facility, idx) => (
              <div key={idx} className="card hover:-translate-y-1 hover:shadow-lg transition-all duration-300 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                    <Hospital className="w-6 h-6" />
                  </div>
                  <span className={`badge-${facility.queue === 'Live' ? 'green' : 'amber'}`}>{facility.queue}</span>
                </div>
                <h3 className="font-bold text-lg mb-1">{facility.name}</h3>
                <p className="text-xs font-medium text-muted mb-4">{facility.type}</p>
                
                <div className="flex items-center gap-4 text-sm pt-4 border-t border-border/50">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted">Avg Wait</span>
                    <span className="font-semibold text-text-main">{facility.wait}</span>
                  </div>
                  <div className="flex flex-col border-l border-border/50 pl-4">
                    <span className="text-xs text-muted">Departments</span>
                    <span className="font-semibold text-text-main">{facility.depts} Active</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="bg-background border-t border-border py-12">
        <div className="page-container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="MediQueue" className="h-6 grayscale opacity-70 dark:brightness-150" />
            </div>
            <p className="text-sm text-muted">
              © {new Date().getFullYear()} MediQueue. Smart OPD Queue & Appointment System. (CodeVoyage Demo)
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
