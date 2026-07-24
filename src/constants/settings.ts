export interface AccentPreset {
  name: string;
  value: string;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { name: "Slate", value: "#1e293b" },
  { name: "Blue", value: "#2563eb" },
  { name: "Indigo", value: "#4f46e5" },
  { name: "Violet", value: "#7c3aed" },
  { name: "Purple", value: "#9333ea" },
  { name: "Pink", value: "#db2777" },
  { name: "Rose", value: "#e11d48" },
  { name: "Red", value: "#dc2626" },
  { name: "Orange", value: "#ea580c" },
  { name: "Amber", value: "#d97706" },
  { name: "Emerald", value: "#059669" },
  { name: "Teal", value: "#0d9488" },
  { name: "Cyan", value: "#0891b2" },
];

export interface LanguageOption {
  code: string;
  label: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
  { code: "it", label: "Italiano" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "zh", label: "中文" },
  { code: "ar", label: "العربية" },
  { code: "hi", label: "हिन्दी" },
  { code: "ru", label: "Русский" },
];

export interface DateFormatOption {
  value: string;
  label: string;
}

// Split-pane layout persisted across editor sessions. Mirrors the LayoutNode
// shape in prompts/SplitPane.tsx; kept here as plain data so it can live in
// the Settings blob without a circular import.
export type LayoutViewId = "edit" | "preview" | "variables" | "history";
export type LayoutOrientation = "h" | "v";
export interface LayoutPane {
  kind: "pane";
  view: LayoutViewId;
}
export interface LayoutSplit {
  kind: "split";
  orientation: LayoutOrientation;
  sizes: number[];
  children: LayoutNode[];
}
export type LayoutNode = LayoutPane | LayoutSplit;

export const DATE_FORMATS: DateFormatOption[] = [
  { value: "MMM d, yyyy", label: "Jul 22, 2026" },
  { value: "dd/MM/yyyy", label: "22/07/2026" },
  { value: "yyyy-MM-dd", label: "2026-07-22" },
  { value: "d MMMM yyyy", label: "22 July 2026" },
  { value: "MM/dd/yyyy", label: "07/22/2026" },
];

export interface LandingPageOption {
  value: "dashboard" | "prompts" | "categories" | "tags";
  label: string;
  description: string;
}

export const LANDING_PAGES: LandingPageOption[] = [
  { value: "dashboard", label: "Dashboard", description: "Overview with stats and recent prompts" },
  { value: "prompts", label: "All Prompts", description: "Full list of all your prompts" },
  { value: "categories", label: "Categories", description: "Browse prompts by category" },
  { value: "tags", label: "Tags", description: "Browse prompts by tags" },
];
