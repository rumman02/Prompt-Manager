/**
 * Restrained color assignment for named resources (categories, tags).
 *
 * Instead of a bright rainbow palette (the "AI slop" default), we use a
 * limited set of muted, desaturated hues derived from the same accent family.
 * Each name deterministically maps to one hue via a simple hash — same name
 * always gets the same color, but all colors live in a narrow, professional
 * range (no neon, no pure saturation).
 *
 * The palette is intentionally small (6 variants) so the UI stays cohesive.
 * Each variant provides bg/text classes that work in both light and dark mode
 * via the CSS custom properties already defined in index.css.
 */

const RESOURCE_HUES = [
  { bg: 'bg-primary/10', text: 'text-primary' },                    // accent
  { bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400' },  // slate
  { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' }, // emerald
  { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },  // amber
  { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400' },   // rose
  { bg: 'bg-sky-500/10', text: 'text-sky-600 dark:text-sky-400' },     // sky
];

export function resourceColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return RESOURCE_HUES[hash % RESOURCE_HUES.length];
}
