import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { PromptListItem } from "./PromptListItem";
import type { PromptRow } from "@/types";

type SortKey = "title" | "category" | "content" | "updated";
type SortDir = "asc" | "desc";

interface SortState {
  key: SortKey;
  dir: SortDir;
}

interface PromptListTableProps {
  prompts: PromptRow[];
  onSelect: (prompt: PromptRow) => void;
  onEdit: (prompt: PromptRow) => void;
  onDelete: (id: number) => void;
  onDuplicate: (id: number) => void;
  onToggleFavorite?: (id: number) => void;
}

const SORTABLE_COLUMNS: { key: SortKey; label: string; align: "start" | "center" | "end" }[] = [
  { key: "title", label: "Title", align: "start" },
  { key: "category", label: "Category", align: "center" },
  { key: "content", label: "Content", align: "center" },
  { key: "updated", label: "Updated", align: "end" },
];

/** Parse a SQLite UTC timestamp ("YYYY-MM-DD HH:MM:SS") into epoch ms. */
function parseTimestamp(value: string): number {
  const normalized = value.endsWith("Z") || value.includes("T") ? value : value + "Z";
  const ms = Date.parse(normalized);
  return Number.isNaN(ms) ? 0 : ms;
}

function comparePrompts(a: PromptRow, b: PromptRow, key: SortKey): number {
  switch (key) {
    case "title":
      return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
    case "category": {
      // Empty/null categories always sort last, regardless of direction.
      const av = a.category?.trim().toLowerCase() || null;
      const bv = b.category?.trim().toLowerCase() || null;
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return av.localeCompare(bv);
    }
    case "content":
      return a.content.length - b.content.length;
    case "updated":
      return parseTimestamp(a.updated_at) - parseTimestamp(b.updated_at);
  }
}

export function PromptListTable({
  prompts,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFavorite,
}: PromptListTableProps) {
  const [sort, setSort] = useState<SortState | null>(null);

  // No sort → preserve the incoming order (App passes most-recently-updated first).
  const visiblePrompts = useMemo(() => {
    if (!sort) return prompts;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...prompts].sort((a, b) => dir * comparePrompts(a, b, sort.key));
  }, [prompts, sort]);

  const toggleSort = (key: SortKey) => {
    setSort((prev) =>
      prev && prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-md grid grid-cols-[1fr_8rem_10rem_6rem_auto] gap-x-4 auto-rows-auto">
      <div className="grid col-span-5 grid-cols-subgrid border-b border-border bg-muted/40 px-4 py-2.5 text-eyebrow text-muted-foreground">
        {SORTABLE_COLUMNS.map((col) => {
          const isActive = sort?.key === col.key;
          return (
            <button
              key={col.key}
              type="button"
              onClick={() => toggleSort(col.key)}
              aria-sort={isActive ? (sort!.dir === "asc" ? "ascending" : "descending") : "none"}
              className={cn(
                "flex items-center gap-1 transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-sm",
                col.align === "start" && "justify-start",
                col.align === "center" && "justify-center",
                col.align === "end" && "justify-end",
                isActive && "text-foreground"
              )}
            >
              {col.label}
              {isActive && (
                <Icon
                  name="chevronDown"
                  size="xs"
                  className={cn("shrink-0 opacity-70", sort!.dir === "asc" && "rotate-180")}
                />
              )}
            </button>
          );
        })}
        <span className="text-right">Actions</span>
      </div>
      <div className="grid col-span-5 grid-cols-subgrid divide-y divide-border contents">
        {visiblePrompts.map((prompt) => (
          <PromptListItem
            key={prompt.id}
            prompt={prompt}
            onSelect={onSelect}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </div>
  );
}
