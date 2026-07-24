// Shared full-width status bar used at the top of a panel. Both the Edit pane's
// stats row and the Preview pane's unfilled-variables helper use it so the two
// panels' top bars stay visually identical (width, padding, divider, colors,
// height) when sitting side-by-side. Content is passed as children so each bar
// keeps its own copy while the chrome stays in one place.
export function PanelStatusBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex shrink-0 items-center gap-x-2.5 border-b border-border px-3 py-1.5 text-caption text-muted-foreground">
      {children}
    </div>
  );
}
