"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme | "system";
  resolvedTheme: Theme;
  setTheme: (theme: Theme | "system") => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [theme, setThemeState] = useState<Theme | "system">("system");
  const [resolvedTheme, setResolvedTheme] = useState<Theme>("light");

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("mediqueue-theme") as Theme | "system" | null;
    if (stored) {
      setThemeState(stored);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let activeTheme: Theme;
    if (theme === "system") {
      activeTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      activeTheme = theme;
    }

    setResolvedTheme(activeTheme);

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(activeTheme);
    
    // Store user preference if not system
    if (theme !== "system") {
      localStorage.setItem("mediqueue-theme", theme);
    } else {
      localStorage.removeItem("mediqueue-theme");
    }
  }, [theme, mounted]);

  // Handle system theme changes
  useEffect(() => {
    if (!mounted || theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const activeTheme = e.matches ? "dark" : "light";
      setResolvedTheme(activeTheme);
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(activeTheme);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, mounted]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  // Avoid hydration mismatch by not rendering until mounted
  // Actually, we should render children but they shouldn't access theme until mounted.
  // Wait, the user said "Do not render theme-dependent UI before mount if that causes mismatch."
  // I will just render children. Any child using useTheme should handle `mounted` state if needed.
  // We can provide a placeholder context before mount if we want to render immediately.
  
  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme: setThemeState, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
