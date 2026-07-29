import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { getTheme, type ThemeColors } from "@/constants/themes";

export type ThemeMode = "light" | "dark" | "system";
export type LandingPage = "dashboard" | "prompts" | "categories" | "tags" | "trash";

export interface Settings {
  accentColor: string;
  theme: ThemeMode;
  /** Active theme preset ID (e.g. "apple", "catppuccin", "tokyonight") */
  themePreset: string;
  language: string;
  dateFormat: string;
  landingPage: LandingPage;
  trashTimeout: number;
  trashTimeoutUnit: "days" | "weeks" | "months";
  /** Last-used editor pane layout (which views, split orientation, sizes). */
  editorLayout: import("@/constants/settings").LayoutNode | null;
  /** Orientation that the next split will use. */
  editorSplitOrientation: import("@/constants/settings").LayoutOrientation;
  /** UI font family */
  fontFamily: string;
  /** Editor / monospace font family */
  editorFontFamily: string;
  /** Base font size (rem) */
  fontSize: string;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
  resetSettings: () => void;
}

const defaultSettings: Settings = {
  accentColor: "#1e293b",
  theme: "system",
  themePreset: "apple",
  language: "en",
  dateFormat: "MMM d, yyyy",
  landingPage: "dashboard",
  trashTimeout: 30,
  trashTimeoutUnit: "days",
  editorLayout: null,
  editorSplitOrientation: "h",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif",
  editorFontFamily: "'SF Mono', SFMono-Regular, ui-monospace, Menlo, Consolas, 'Liberation Mono', monospace",
  fontSize: "0.875rem",
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

function applyThemeColors(root: HTMLElement, colors: ThemeColors, isDark: boolean, accentColor: string) {
  // Convert accent hex to HSL
  const accent = hexToHsl(accentColor);

  // Use accent color as primary if it's not the default Apple blue
  // Otherwise use the theme's primary
  const primary = hexToHsl(colors.primary);
  const primaryL = isDark ? Math.max(primary.l, 75) : primary.l;
  const foregroundL = primaryL > 75 ? 4.9 : 98;

  // Helper to set CSS var
  const set = (name: string, value: string) => root.style.setProperty(name, value);

  // Surfaces
  const bg = hexToHsl(colors.background);
  const fg = hexToHsl(colors.foreground);
  const card = hexToHsl(colors.card);
  const cardFg = hexToHsl(colors.cardForeground);
  const pop = hexToHsl(colors.popover);
  const popFg = hexToHsl(colors.popoverForeground);

  set("--background", `${bg.h} ${bg.s}% ${bg.l}%`);
  set("--foreground", `${fg.h} ${fg.s}% ${fg.l}%`);
  set("--card", `${card.h} ${card.s}% ${card.l}%`);
  set("--card-foreground", `${cardFg.h} ${cardFg.s}% ${cardFg.l}%`);
  set("--popover", `${pop.h} ${pop.s}% ${pop.l}%`);
  set("--popover-foreground", `${popFg.h} ${popFg.s}% ${popFg.l}%`);

  // Primary (accent)
  // In dark mode, ensure the accent has sufficient lightness for contrast
  // against dark surfaces. Without this, dark accent colors (e.g. #1e293b,
  // #000000) make text-primary and bg-primary/10 nearly invisible.
  const MIN_DARKMODE_LIGHTNESS = 62;
  const adjustedL = isDark ? Math.max(accent.l, MIN_DARKMODE_LIGHTNESS) : accent.l;
  set("--primary", `${accent.h} ${accent.s}% ${adjustedL}%`);
  set("--primary-foreground", `${accent.h} ${accent.s > 0 ? 40 : 0}% ${adjustedL > 75 ? 4.9 : 98}%`);

  // Secondary
  const sec = hexToHsl(colors.secondary);
  const secFg = hexToHsl(colors.secondaryForeground);
  set("--secondary", `${sec.h} ${sec.s}% ${sec.l}%`);
  set("--secondary-foreground", `${secFg.h} ${secFg.s}% ${secFg.l}%`);

  // Muted
  const mut = hexToHsl(colors.muted);
  const mutFg = hexToHsl(colors.mutedForeground);
  set("--muted", `${mut.h} ${mut.s}% ${mut.l}%`);
  set("--muted-foreground", `${mutFg.h} ${mutFg.s}% ${mutFg.l}%`);

  // Accent
  const acc = hexToHsl(colors.accent);
  const accFg = hexToHsl(colors.accentForeground);
  set("--accent", `${acc.h} ${acc.s}% ${acc.l}%`);
  set("--accent-foreground", `${accFg.h} ${accFg.s}% ${accFg.l}%`);

  // Destructive
  const des = hexToHsl(colors.destructive);
  const desFg = hexToHsl(colors.destructiveForeground);
  set("--destructive", `${des.h} ${des.s}% ${des.l}%`);
  set("--destructive-foreground", `${desFg.h} ${desFg.s}% ${desFg.l}%`);

  // Borders
  const bor = hexToHsl(colors.border);
  const inp = hexToHsl(colors.input);
  const rin = hexToHsl(colors.ring);
  set("--border", `${bor.h} ${bor.s}% ${bor.l}%`);
  set("--input", `${inp.h} ${inp.s}% ${inp.l}%`);
  set("--ring", `${rin.h} ${rin.s}% ${rin.l}%`);

  // Extended
  const ts = hexToHsl(colors.textSecondary);
  set("--text-secondary", `${ts.h} ${ts.s}% ${ts.l}%`);

  const a2 = hexToHsl(colors.accent2);
  set("--accent-2-h", `${a2.h}`);
  set("--accent-2-s", `${a2.s}%`);
  set("--accent-2-l", `${a2.l}%`);

  // Code zone
  const cbg = hexToHsl(colors.codeBg);
  const cbd = hexToHsl(colors.codeBorder);
  set("--code-bg", `${cbg.h} ${cbg.s}% ${cbg.l}%`);
  set("--code-border", `${cbd.h} ${cbd.s}% ${cbd.l}%`);
  set("--code-accent", `var(--primary)`);
  set("--token-sat", colors.tokenSat);
  set("--token-bg-l", colors.tokenBgL);
  set("--token-fg-l", colors.tokenFgL);
  set("--token-border-l", colors.tokenBorderL);

  // Status
  const suc = hexToHsl(colors.success);
  const war = hexToHsl(colors.warning);
  const tl = hexToHsl(colors.tertiaryLabel);
  set("--success", `${suc.h} ${suc.s}% ${suc.l}%`);
  set("--warning", `${war.h} ${war.s}% ${war.l}%`);
  set("--tertiary-label", `${tl.h} ${tl.s}% ${tl.l}%`);
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

  // Apply theme preset + mode
  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    const isDark = settings.theme === "dark" || (settings.theme === "system" && mq.matches);
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Get the theme colors for the current mode
    const theme = getTheme(settings.themePreset);
    const variant = isDark ? theme.variants.dark : theme.variants.light;
    const colors = variant.colors;

    // Apply all CSS variables from the theme
    applyThemeColors(root, colors, isDark, settings.accentColor);

    if (settings.theme === "system") {
      const handler = (e: MediaQueryListEvent) => {
        const dark = e.matches;
        if (dark) {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
        const v = dark ? theme.variants.dark : theme.variants.light;
        applyThemeColors(root, v.colors, dark, settings.accentColor);
      };
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [settings.theme, settings.themePreset, settings.accentColor]);

  // Apply font settings
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--font-ui", settings.fontFamily);
    root.style.setProperty("--font-editor", settings.editorFontFamily);
    root.style.setProperty("--font-size-base", settings.fontSize);
  }, [settings.fontFamily, settings.editorFontFamily, settings.fontSize]);

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    // Clear all inline styles so CSS defaults take over
    const root = document.documentElement;
    const vars = [
      "--background", "--foreground", "--card", "--card-foreground",
      "--popover", "--popover-foreground", "--primary", "--primary-foreground",
      "--secondary", "--secondary-foreground", "--muted", "--muted-foreground",
      "--accent", "--accent-foreground", "--destructive", "--destructive-foreground",
      "--border", "--input", "--ring", "--text-secondary",
      "--accent-2-h", "--accent-2-s", "--accent-2-l",
      "--code-bg", "--code-border", "--code-accent",
      "--token-sat", "--token-bg-l", "--token-fg-l", "--token-border-l",
      "--success", "--warning", "--tertiary-label",
      "--font-ui", "--font-editor", "--font-size-base",
    ];
    vars.forEach((v) => root.style.removeProperty(v));
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
