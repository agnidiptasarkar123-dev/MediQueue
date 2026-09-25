import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MediQueue — Smart OPD Queue & Appointment System",
  description:
    "Book OPD appointments, join live queues remotely, track your real-time queue position and get notified when your turn approaches.",
  keywords: "hospital queue, OPD appointment, digital token, real-time queue tracking",
};

import { I18nProvider } from "@/lib/i18n";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
          <div className="demo-banner">
            ⚠ Demo Environment — All patient data shown is synthetic and created for demonstration purposes only.
          </div>
        )}
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
