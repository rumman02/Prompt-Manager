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
          className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
