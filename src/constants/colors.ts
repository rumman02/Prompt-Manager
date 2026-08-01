/**
 * Restrained color assignment for named resources (categories, tags).
 *
 * Each entity can carry a user-chosen color key, persisted next to its custom
 * icon. The default is the single theme accent; the other keys are a small set
 * of muted, desaturated hues that work in both light and dark mode via the CSS
 * custom properties already defined in index.css.
 *
 * The palette is intentionally small (6 keys) so the UI stays cohesive. Each
 * key provides bg/text classes plus a swatch/label for pickers.
 */

export type ResourceColorKey = "accent" | "slate" | "emerald" | "amber" | "rose" | "sky";

export const RESOURCE_COLORS: Record<
  ResourceColorKey,
  { bg: string; text: string; swatch: string; label: string }
> = {
  accent: { bg: "bg-primary/10", text: "text-primary", swatch: "bg-primary", label: "Accent" },
  slate: { bg: "bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", swatch: "bg-slate-500", label: "Slate" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", swatch: "bg-emerald-500", label: "Emerald" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", swatch: "bg-amber-500", label: "Amber" },
  rose: { bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400", swatch: "bg-rose-500", label: "Rose" },
  sky: { bg: "bg-sky-500/10", text: "text-sky-600 dark:text-sky-400", swatch: "bg-sky-500", label: "Sky" },
};

export const RESOURCE_COLOR_KEYS: ResourceColorKey[] = [
  "accent",
  "slate",
  "emerald",
  "amber",
  "rose",
  "sky",
];

export const DEFAULT_RESOURCE_COLOR: ResourceColorKey = "accent";

export function isResourceColorKey(v: unknown): v is ResourceColorKey {
  return typeof v === "string" && (RESOURCE_COLOR_KEYS as string[]).includes(v);
}

/** Resolve a stored color key to its bg/text classes; invalid/missing -> accent. */
export function resourceColor(colorKey?: string | null): { bg: string; text: string } {
  const key = isResourceColorKey(colorKey) ? colorKey : DEFAULT_RESOURCE_COLOR;
  const { bg, text } = RESOURCE_COLORS[key];
  return { bg, text };
}
