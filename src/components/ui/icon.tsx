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
// Inline icons default to "md" = 16px = shadcn's size-4. The named tokens are
// kept so existing callers using `size="sm"` etc. keep resolving.
export const ICON_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
} as const;

export type IconSize = keyof typeof ICON_SIZES;

// ── Icon registry ───────────────────────────────────────────────────────────
// Maps semantic names to Lucide components. The Icon component looks the name
// up here and delegates to the lucide-react component directly.
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
} as const satisfies Record<string, LucideIcon>;

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
// Thin, typed wrapper over lucide-react: resolves the name through ICON_MAP and
// renders the lucide component with shadcn-consistent defaults (16px / size-4
// inline, strokeWidth 2). Color comes from `currentColor` via text-* classes.

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
  className,
  strokeWidth,
  fill = "none",
}: IconProps) {
  const LucideComp = ICON_MAP[name];
  const pixelSize = typeof size === "number" ? size : ICON_SIZES[size];

  return (
    <LucideComp
      size={pixelSize}
      strokeWidth={strokeWidth ?? 2}
      className={className}
      fill={fill}
      stroke="currentColor"
      aria-hidden="true"
    />
  );
}

export type { LucideIcon };
