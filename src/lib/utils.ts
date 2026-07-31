import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  // SQLite CURRENT_TIMESTAMP stores UTC as a naive string ("YYYY-MM-DD HH:MM:SS")
  // with no timezone suffix. `new Date("... 23:26:52")` parses that as LOCAL time,
  // silently shifting the instant by the user's UTC offset (e.g. a version saved
  // "now" shows "6h ago" in UTC+6). Append "Z" so it is parsed as UTC, then compute
  // the relative time against the user's local Date.now().
  const date = new Date(dateStr.endsWith("Z") || dateStr.includes("T") ? dateStr : dateStr + "Z");
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
  /** Number of distinct {{variable}} placeholders detected in the content. */
  variables: number;
}

// Matches {{variable_name}} placeholders. Shared by the editor highlight
// overlay, the variables sidebar extraction, and the preview compiler so the
// three never drift apart.
export const VARIABLE_TOKEN_RE = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;

/** Map a variable name to a stable hue for its token pill. Shared by the
 *  editor overlay and the compiled preview so a given name is always the
 *  same color in both. */
export function hashHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  // spread across the wheel but avoid the amber reserved for --accent-2 (approx 32)
  return h % 330;
}

export interface CompileResult {
  /** Prompt content with saved values substituted; unfilled vars stay as {{name}}. */
  text: string;
  /** Names that have no saved value yet, in order of first appearance. */
  unfilled: string[];
}

/**
 * Compile prompt content by substituting saved variable values.
 *
 * Every {{name}} occurrence is replaced by its saved value when present. Names
 * without a value are left as literal {{name}} (NOT silently dropped to an empty
 * string, which would hide the gap) and reported in `unfilled` so callers can
 * warn the user. Formatting and line breaks are preserved exactly — only the
 * tokens themselves are swapped. Reusable for copy, export, and a future
 * "run this prompt" feature.
 */
export function compilePrompt(content: string, variableValues: Record<string, string>): CompileResult {
  const unfilled: string[] = [];
  const seen = new Set<string>();
  const text = content.replace(VARIABLE_TOKEN_RE, (match, name: string) => {
    const value = variableValues[name];
    if (value !== undefined && value.trim().length > 0) {
      return value;
    }
    if (!seen.has(name)) {
      seen.add(name);
      unfilled.push(name);
    }
    return match;
  });
  return { text, unfilled };
}

/**
 * Lightweight content metrics for the editor status bar. Token count is an
 * approximation (~1.33 tokens per word, the common GPT-style rule of thumb)
 * — good enough for a live characterisation of the prompt, not billing-grade.
 */
export function getContentStats(text: string): ContentStats {
  if (!text || text.trim().length === 0) {
    return { tokens: 0, words: 0, sentences: 0, paragraphs: 0, variables: 0 };
  }
  const words = text.trim().split(/\s+/).length;
  const sentences = (text.match(/[.!?]+/g) || []).length || (words > 0 ? 1 : 0);
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length || (words > 0 ? 1 : 0);
  const tokens = Math.ceil(words * 1.33);
  // Distinct {{variable}} placeholders, matching the shared VARIABLE_TOKEN_RE
  // used by the editor highlight overlay, variables sidebar, and preview
  // compiler — so the count can't drift from what those surfaces report.
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  VARIABLE_TOKEN_RE.lastIndex = 0;
  while ((m = VARIABLE_TOKEN_RE.exec(text)) !== null) {
    seen.add(m[1]);
  }
  return { tokens, words, sentences, paragraphs, variables: seen.size };
}
