export const RESOURCE_COLORS = [
  { bg: "bg-blue-500/10", text: "text-blue-500 dark:text-blue-400" },
  { bg: "bg-violet-500/10", text: "text-violet-500 dark:text-violet-400" },
  { bg: "bg-emerald-500/10", text: "text-emerald-500 dark:text-emerald-400" },
  { bg: "bg-amber-500/10", text: "text-amber-500 dark:text-amber-400" },
  { bg: "bg-rose-500/10", text: "text-rose-500 dark:text-rose-400" },
  { bg: "bg-cyan-500/10", text: "text-cyan-500 dark:text-cyan-400" },
  { bg: "bg-pink-500/10", text: "text-pink-500 dark:text-pink-400" },
  { bg: "bg-teal-500/10", text: "text-teal-500 dark:text-teal-400" },
  { bg: "bg-orange-500/10", text: "text-orange-500 dark:text-orange-400" },
  { bg: "bg-indigo-500/10", text: "text-indigo-500 dark:text-indigo-400" },
];

export function resourceColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return RESOURCE_COLORS[hash % RESOURCE_COLORS.length];
}