"use client";
import React from "react";
import { useTheme } from "@/lib/theme";
import { Sun, Moon, Monitor } from "lucide-react";
import { useState, useEffect } from "react";

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9" />; // Placeholder to prevent layout shift
  }

  return (
    <div className="flex bg-border/40 p-1 rounded-xl">
      <button
        onClick={() => setTheme("light")}
        className={`p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent ${theme === 'light' ? 'bg-surface text-accent shadow-sm' : 'text-muted hover:text-text-main'}`}
        aria-label="Switch to light mode"
        title="Light Mode"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent ${theme === 'dark' ? 'bg-surface text-accent shadow-sm' : 'text-muted hover:text-text-main'}`}
        aria-label="Switch to dark mode"
        title="Dark Mode"
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent ${theme === 'system' ? 'bg-surface text-accent shadow-sm' : 'text-muted hover:text-text-main'}`}
        aria-label="Switch to system theme"
        title="System Theme"
      >
        <Monitor className="w-4 h-4" />
      </button>
    </div>
  );
}
