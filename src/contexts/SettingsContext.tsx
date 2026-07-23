import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type LandingPage = "dashboard" | "prompts" | "categories" | "tags" | "trash";

export interface Settings {
  accentColor: string;
  theme: ThemeMode;
  language: string;
  dateFormat: string;
  landingPage: LandingPage;
  trashTimeout: number;
  trashTimeoutUnit: "days" | "weeks" | "months";
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
  resetSettings: () => void;
}

const defaultSettings: Settings = {
  accentColor: "#1e293b",
  theme: "system",
  language: "en",
  dateFormat: "MMM d, yyyy",
  landingPage: "dashboard",
  trashTimeout: 30,
  trashTimeoutUnit: "days",
};

const STORAGE_KEY = "prompt-manager-settings";

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error("Failed to load settings:", e);
  }
  return defaultSettings;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function rgbToLin(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

// Relative luminance per WCAG 2.1
function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  return 0.2126 * rgbToLin(r) + 0.7152 * rgbToLin(g) + 0.0722 * rgbToLin(b);
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const { r, g, b } = hexToRgb(hex);
  const r1 = r / 255;
  const g1 = g / 255;
  const b1 = b / 255;

  const max = Math.max(r1, g1, b1);
  const min = Math.min(r1, g1, b1);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r1:
        h = ((g1 - b1) / d + (g1 < b1 ? 6 : 0)) / 6;
        break;
      case g1:
        h = ((b1 - r1) / d + 2) / 6;
        break;
      case b1:
        h = ((r1 - g1) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  }, [settings]);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    if (settings.theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(mediaQuery.matches);
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    } else {
      applyTheme(settings.theme === "dark");
    }
  }, [settings.theme]);

  // Apply accent color
  useEffect(() => {
    const root = document.documentElement;
    const { h, s, l } = hexToHsl(settings.accentColor);

    root.style.setProperty("--primary", `${h} ${s}% ${l}%`);

    // Auto-adjust primary-foreground for contrast. Default to white text for legibility
    // against the accent; only use dark text when the accent is genuinely light (high
    // luminance) such that white would be unreadable against it.
    const primaryLum = relativeLuminance(hexToRgb(settings.accentColor));
    const foregroundL = primaryLum > 0.55 ? 4.9 : 98;
    root.style.setProperty("--primary-foreground", `${h} ${s > 0 ? 40 : 0}% ${foregroundL}%`);
  }, [settings.accentColor]);

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    // Clear inline styles so CSS defaults take over
    document.documentElement.style.removeProperty("--primary");
    document.documentElement.style.removeProperty("--primary-foreground");
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
