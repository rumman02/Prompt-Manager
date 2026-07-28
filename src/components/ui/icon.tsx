/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized Icon System — Lucide Icons
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Single source of truth for all iconography in the app.
 *
 * • Library:     Lucide React (lucide-react)
 * • Stroke width: 1.5px (default) — matches Apple SF Symbols optical weight
 * • Sizes:        xs=12  sm=14  md=16  lg=20  xl=24  (design token scale)
 * • Color:        inherits via currentColor — set with text-* utility classes
 * • Optical align: -ml-0.5 on list-row icons to compensate for stroke inset
 *
 * Never use inline <svg>, emoji, or mixed icon libraries. Import the Lucide
 * component here and wrap it through <Icon> for consistent sizing.
 */

import {
  LayoutDashboard,
  Bot,
  Zap,
  List,
  FolderOpen,
  Heart,
  Tag,
  Trash2,
  Settings,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Pencil,
  Copy,
  Star,
  AlertCircle,
  Info,
  Check,
  FileText,
  MoreVertical,
  ArrowRight,
  RotateCcw,
  Save,
  Palette,
  Sun,
  Moon,
  Monitor,
  Globe,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Variable,
  History,
  Eye,
  GripVertical,
  Columns2,
  Rows2,
  Minimize2,
  Clipboard,
  Hash,
  type LucideIcon,
} from "lucide-react";

// ── Size token map ──────────────────────────────────────────────────────────
export const ICON_SIZES = {
  xs: 12,   // inline micro-indicators (e.g. meta badges)
  sm: 14,   // dense UI (list rows, menu items, tags)
  md: 16,   // standard UI (buttons, inputs, nav)
  lg: 20,   // section headers, prominent actions
  xl: 24,   // empty-state heroes, theme previews
} as const;

export type IconSize = keyof typeof ICON_SIZES;

// ── Icon registry ───────────────────────────────────────────────────────────
// Maps semantic names to Lucide components. Use these in components for
// consistency and easy future swapping.
export const ICON_MAP = {
  // Navigation
  dashboard: LayoutDashboard,
  agents: Bot,
  skills: Zap,
  prompts: List,
  categories: FolderOpen,
  favorites: Heart,
  tags: Tag,
  trash: Trash2,
  settings: Settings,

  // Actions
  search: Search,
  add: Plus,
  close: X,
  edit: Pencil,
  copy: Copy,
  star: Star,
  starFilled: Star,
  delete: Trash2,
  more: MoreVertical,
  save: Save,
  reset: RotateCcw,
  back: ChevronLeft,
  forward: ChevronRight,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,

  // UI elements
  alert: AlertCircle,
  info: Info,
  check: Check,
  file: FileText,
  clipboard: Clipboard,
  hash: Hash,
  sparkles: Sparkles,
  variable: Variable,
  history: History,
  eye: Eye,
  grip: GripVertical,
  columns: Columns2,
  rows: Rows2,
  minimize: Minimize2,
  palette: Palette,

  // Theme
  sun: Sun,
  moon: Moon,
  monitor: Monitor,
  globe: Globe,

  // Sidebar
  sidebarClose: PanelLeftClose,
  sidebarOpen: PanelLeftOpen,

  // Misc
  arrowRight: ArrowRight,
} as const;

export type IconName = keyof typeof ICON_MAP;

// ── Icon component ──────────────────────────────────────────────────────────

interface IconProps {
  name: IconName;
  size?: IconSize | number;
  className?: string;
  strokeWidth?: number;
  fill?: "none" | "currentColor";
}

export function Icon({
  name,
  size = "md",
  className = "",
  strokeWidth,
  fill = "none",
}: IconProps) {
  const LucideComp = ICON_MAP[name];
  const pixelSize = typeof size === "number" ? size : ICON_SIZES[size];

  return (
    <LucideComp
      size={pixelSize}
      strokeWidth={strokeWidth ?? (fill === "currentColor" ? 0 : 1.5)}
      className={className}
      fill={fill}
      stroke="currentColor"
    />
  );
}

// ── Re-export individual icons for direct import ────────────────────────────
export {
  LayoutDashboard,
  Bot,
  Zap,
  List,
  FolderOpen,
  Heart,
  Tag,
  Trash2,
  Settings,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Pencil,
  Copy,
  Star,
  AlertCircle,
  Info,
  Check,
  FileText,
  MoreVertical,
  ArrowRight,
  RotateCcw,
  Save,
  Palette,
  Sun,
  Moon,
  Monitor,
  Globe,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Variable,
  History,
  Eye,
  GripVertical,
  Columns2,
  Rows2,
  Minimize2,
  Clipboard,
  Hash,
};

export type { LucideIcon };
