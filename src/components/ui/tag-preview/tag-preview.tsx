import { cn } from "@/lib/utils";

interface TagPreviewProps {
  tags: string;
  className?: string;
}

export function TagPreview({ tags, className }: TagPreviewProps) {
  const parsed = tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (parsed.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {parsed.map((tag, i) => (
        <span
          key={i}
          className="inline-flex items-center rounded-md bg-[hsl(var(--secondary))] px-2 py-0.5 text-[11px] font-medium text-[hsl(var(--secondary-foreground))] ring-1 ring-inset ring-[hsl(var(--border))]"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
