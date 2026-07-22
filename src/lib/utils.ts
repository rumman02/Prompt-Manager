import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export interface ContentStats {
  tokens: number;
  words: number;
  sentences: number;
  paragraphs: number;
}

export function getContentStats(text: string): ContentStats {
  if (!text || text.trim().length === 0) {
    return { tokens: 0, words: 0, sentences: 0, paragraphs: 0 };
  }
  const words = text.trim().split(/\s+/).length;
  const sentences = (text.match(/[.!?]+/g) || []).length || (words > 0 ? 1 : 0);
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length || (words > 0 ? 1 : 0);
  const tokens = Math.ceil(words * 1.33);
  return { tokens, words, sentences, paragraphs };
}
