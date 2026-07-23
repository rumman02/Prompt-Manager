import { cn } from "@/lib/utils";

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  side: "left" | "right";
  isActive?: boolean;
}

/**
 * Thin vertical strip placed on the inner edge of a sidebar. Visually subtle
 * until hovered/active so it doesn't compete with content, but clearly signals
 * draggability via cursor-col-resize.
 */
export function ResizeHandle({ onMouseDown, side, isActive }: ResizeHandleProps) {
  return (
    <div
      onMouseDown={onMouseDown}
      className={cn(
        "relative z-10 flex w-1.5 shrink-0 cursor-col-resize items-center justify-center transition-colors",
        "hover:bg-primary/30 active:bg-primary/40",
        isActive && "bg-primary/30",
        // Faint resting indicator line down the middle.
        "before:absolute before:bottom-3 before:top-3 before:w-px before:rounded-full before:bg-border",
        side === "left" ? "before:right-0.5" : "before:left-0.5"
      )}
    />
  );
}
