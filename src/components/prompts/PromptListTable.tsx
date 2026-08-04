import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
} from "@/components/ui/table";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
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
    <div className="rounded-xl bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            {SORTABLE_COLUMNS.map((col) => {
              const isActive = sort?.key === col.key;
              return (
                <TableHead
                  key={col.key}
                  className={cn(
                    "h-10 px-4",
                    col.align === "center" && "text-center",
                    col.align === "end" && "text-right",
                  )}
                  aria-sort={
                    isActive ? (sort!.dir === "asc" ? "ascending" : "descending") : "none"
                  }
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSort(col.key)}
                    className={cn(
                      "h-7 gap-1 px-1.5 font-medium text-muted-foreground hover:text-foreground",
                      col.align === "center" && "justify-center",
                      col.align === "end" && "justify-end",
                      isActive && "text-foreground",
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
                  </Button>
                </TableHead>
              );
            })}
            <TableHead className="h-10 px-4 text-right font-medium text-muted-foreground">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
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
        </TableBody>
      </Table>
    </div>
  );
}
