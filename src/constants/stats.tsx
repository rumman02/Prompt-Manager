import {
  IconRobot,
  IconBolt,
  IconFileText,
  IconFolder,
  IconHeart,
  IconTag,
  IconTrash,
} from "@tabler/icons-react";

export interface StatConfig {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

export const STAT_CONFIGS: StatConfig[] = [
  {
    title: "Agents",
    icon: IconRobot,
    color: "text-violet-600",
    bgColor: "bg-violet-50",
  },
  {
    title: "Skills",
    icon: IconBolt,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
  },
  {
    title: "Prompts",
    icon: IconFileText,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "Categories",
    icon: IconFolder,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    title: "Favorites",
    icon: IconHeart,
    color: "text-yellow-500",
    bgColor: "bg-yellow-50",
  },
  {
    title: "Tags",
    icon: IconTag,
    color: "text-orange-500",
    bgColor: "bg-orange-50",
  },
  {
    title: "Trash",
    icon: IconTrash,
    color: "text-slate-500",
    bgColor: "bg-slate-100",
  },
];
