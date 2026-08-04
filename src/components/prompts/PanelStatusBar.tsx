import { cn } from "@/lib/utils";

/**
 * Shared full-width status bar used at the top of a panel. Both the Edit pane's
 * stats row and the Preview pane's unfilled-variables helper use it so the two
 * panels' top bars stay visually identical (width, padding, divider, colors,
 * height) when sitting side-by-side. Content is passed as children so each bar
 * keeps its own copy while the chrome stays in one place.
 */
export function PanelStatusBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-x-2.5 px-3 py-1.5 pb-2 text-xs text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}
