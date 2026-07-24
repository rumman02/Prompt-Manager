import { cn } from "@/lib/utils";

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  /** Which edge the handle sits on. "left"/"right" produce a vertical handle
   *  (col-resize) between side-by-side panes; "top"/"bottom" a horizontal one
   *  (row-resize) between stacked panes. */
  side: "left" | "right" | "top" | "bottom";
  isActive?: boolean;
}

/**
 * Thin strip placed on the inner edge of a pane. Vertical (left/right) between
 * side-by-side panes, horizontal (top/bottom) between stacked panes. Visually
 * subtle until hovered/active so it doesn't compete with content, but clearly
 * signals draggability via the appropriate resize cursor.
 */
export function ResizeHandle({ onMouseDown, side, isActive }: ResizeHandleProps) {
  const isHorizontal = side === "left" || side === "right";
  return (
    <div
      onMouseDown={onMouseDown}
      className={cn(
        "relative z-10 flex shrink-0 items-center justify-center transition-colors",
        isHorizontal ? "w-1.5 cursor-col-resize" : "h-1.5 cursor-row-resize",
        "hover:bg-primary/30 active:bg-primary/40",
        isActive && "bg-primary/30",
        // Faint resting indicator line down the middle.
        "before:absolute before:rounded-full before:bg-border",
        isHorizontal
          ? "before:bottom-3 before:top-3 before:w-px"
          : "before:left-3 before:right-3 before:h-px",
        isHorizontal
          ? side === "left"
            ? "before:right-0.5"
            : "before:left-0.5"
          : side === "top"
            ? "before:bottom-0.5"
            : "before:top-0.5"
      )}
    />
  );
}
