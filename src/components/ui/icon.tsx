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
  Code,
  Terminal,
  Braces,
  BookOpen,
  Book,
  Bug,
  Beaker,
  Brain,
  Briefcase,
  Building2,
  Calendar,
  ChartBar,
  CircleDot,
  Cloud,
  Compass,
  Cpu,
  Database,
  Feather,
  FileCode,
  FilePen,
  FlaskConical,
  Flag,
  Folder,
  Gauge,
  Gift,
  GraduationCap,
  Hammer,
  Headphones,
  Image,
  Inbox,
  Key,
  Languages,
  Layers,
  Lightbulb,
  Link,
  Lock,
  Mail,
  MapPin,
  Megaphone,
  MessageSquare,
  Music,
  Newspaper,
  Notebook,
  Package,
  Paintbrush,
  PenTool,
  Percent,
  PieChart,
  Play,
  Puzzle,
  Quote,
  Radar,
  Receipt,
  Rocket,
  Ruler,
  ScrollText,
  Server,
  Shapes,
  Shield,
  ShoppingCart,
  Shuffle,
  Signpost,
  Speech,
  Split,
  Sprout,
  Target,
  Timer,
  ToyBrick,
  TrendingUp,
  Trophy,
  Users,
  Wand2,
  Workflow,
  Wrench,
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

  // ── Pickable content icons (user-selectable for prompts/categories/tags) ──
  code: Code,
  terminal: Terminal,
  braces: Braces,
  bookOpen: BookOpen,
  book: Book,
  bug: Bug,
  beaker: Beaker,
  brain: Brain,
  briefcase: Briefcase,
  building: Building2,
  calendar: Calendar,
  chartBar: ChartBar,
  circleDot: CircleDot,
  cloud: Cloud,
  compass: Compass,
  cpu: Cpu,
  database: Database,
  feather: Feather,
  fileCode: FileCode,
  filePen: FilePen,
  flask: FlaskConical,
  flag: Flag,
  folder: Folder,
  gauge: Gauge,
  gift: Gift,
  graduation: GraduationCap,
  hammer: Hammer,
  headphones: Headphones,
  image: Image,
  inbox: Inbox,
  key: Key,
  languages: Languages,
  layers: Layers,
  lightbulb: Lightbulb,
  link: Link,
  lock: Lock,
  mail: Mail,
  mapPin: MapPin,
  megaphone: Megaphone,
  message: MessageSquare,
  music: Music,
  newspaper: Newspaper,
  notebook: Notebook,
  package: Package,
  paintbrush: Paintbrush,
  penTool: PenTool,
  percent: Percent,
  pieChart: PieChart,
  play: Play,
  puzzle: Puzzle,
  quote: Quote,
  radar: Radar,
  receipt: Receipt,
  rocket: Rocket,
  ruler: Ruler,
  scroll: ScrollText,
  server: Server,
  shapes: Shapes,
  shield: Shield,
  cart: ShoppingCart,
  shuffle: Shuffle,
  signpost: Signpost,
  speech: Speech,
  split: Split,
  sprout: Sprout,
  target: Target,
  timer: Timer,
  toyBrick: ToyBrick,
  trending: TrendingUp,
  trophy: Trophy,
  users: Users,
  wand: Wand2,
  workflow: Workflow,
  wrench: Wrench,
} as const;

export type IconName = keyof typeof ICON_MAP;

export interface IconPickerGroup {
  label: string;
  icons: IconName[];
}

/** Curated, grouped icon catalog offered in the icon picker UI. */
export const ICON_PICKER_GROUPS: IconPickerGroup[] = [
  {
    label: "General",
    icons: ["file", "prompts", "categories", "tags", "folder", "notebook", "book", "bookOpen", "scroll", "quote", "inbox", "package", "layers", "shapes", "hash"],
  },
  {
    label: "Development",
    icons: ["code", "terminal", "braces", "fileCode", "filePen", "bug", "database", "server", "cpu", "workflow", "split", "shuffle", "puzzle", "toyBrick", "wrench", "hammer"],
  },
  {
    label: "Writing & Media",
    icons: ["penTool", "feather", "paintbrush", "palette", "image", "music", "headphones", "megaphone", "speech", "message", "mail", "newspaper", "languages"],
  },
  {
    label: "Business & Data",
    icons: ["briefcase", "building", "chartBar", "pieChart", "trending", "gauge", "percent", "receipt", "cart", "users", "calendar", "timer", "target", "flag"],
  },
  {
    label: "Science & Ideas",
    icons: ["beaker", "flask", "brain", "lightbulb", "sparkles", "graduation", "compass", "radar", "rocket", "sprout", "trophy", "gift", "wand", "signpost", "ruler"],
  },
  {
    label: "System",
    icons: ["settings", "shield", "lock", "key", "link", "cloud", "eye", "play", "star", "favorites", "circleDot", "mapPin", "agents", "skills", "variable"],
  },
];

/** Flat list of every pickable icon name, in picker-group order. */
export const PICKABLE_ICON_NAMES: IconName[] = ICON_PICKER_GROUPS.flatMap((g) => g.icons);

/** Type guard: is this arbitrary string a valid icon name in the registry? */
export function isIconName(value: string | null | undefined): value is IconName {
  return !!value && value in ICON_MAP;
}

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
  Code,
  Terminal,
  Braces,
  BookOpen,
  Book,
  Bug,
  Beaker,
  Brain,
  Briefcase,
  Building2,
  Calendar,
  ChartBar,
  CircleDot,
  Cloud,
  Compass,
  Cpu,
  Database,
  Feather,
  FileCode,
  FilePen,
  FlaskConical,
  Flag,
  Folder,
  Gauge,
  Gift,
  GraduationCap,
  Hammer,
  Headphones,
  Image,
  Inbox,
  Key,
  Languages,
  Layers,
  Lightbulb,
  Link,
  Lock,
  Mail,
  MapPin,
  Megaphone,
  MessageSquare,
  Music,
  Newspaper,
  Notebook,
  Package,
  Paintbrush,
  PenTool,
  Percent,
  PieChart,
  Play,
  Puzzle,
  Quote,
  Radar,
  Receipt,
  Rocket,
  Ruler,
  ScrollText,
  Server,
  Shapes,
  Shield,
  ShoppingCart,
  Shuffle,
  Signpost,
  Speech,
  Split,
  Sprout,
  Target,
  Timer,
  ToyBrick,
  TrendingUp,
  Trophy,
  Users,
  Wand2,
  Workflow,
  Wrench,
};

export type { LucideIcon };
