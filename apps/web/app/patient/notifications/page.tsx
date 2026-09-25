"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Check } from "lucide-react";
import { getNotifications } from "@/lib/api";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Array<{ id: string; type: string; title: string; message: string; isRead: boolean; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications().then((r) => { setNotifications(r.data || []); setLoading(false); });
  }, []);

  const iconMap: Record<string, string> = {
    THREE_TURNS_AWAY: "⏰",
    YOUR_TURN: "🎉",
    CONSULTATION_COMPLETE: "✅",
    APPOINTMENT_REMINDER: "📅",
    GENERAL: "📢",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="page-container py-4 flex items-center gap-4">
          <Link href="/patient/dashboard" className="btn-icon"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="font-bold text-slate-900">Notifications</h1>
        </div>
      </div>

      <div className="page-container py-6 max-w-2xl mx-auto">
        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
        ) : notifications.length === 0 ? (
          <div className="card p-12 text-center">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="font-semibold text-slate-700">No notifications</h2>
            <p className="text-slate-500 text-sm mt-1">You'll be notified when your turn approaches.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div key={n.id} className={`card p-4 flex items-start gap-3 ${!n.isRead ? "border-blue-200 bg-blue-50/30" : ""}`}>
                <div className="text-2xl shrink-0">{iconMap[n.type] || "📢"}</div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-800 text-sm">{n.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{n.message}</div>
                  <div className="text-xs text-slate-400 mt-2">
                    {new Date(n.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                {n.isRead && <Check className="w-4 h-4 text-slate-300 shrink-0" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
