import { getCurrentWindow } from "@tauri-apps/api/window";
import { cn } from "@/lib/utils";

const IS_MAC = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);

/** Height of the custom title bar, in px. Used to offset the app shell below it. */
export const TITLEBAR_HEIGHT = 40;

export function TitleBar() {
  /** Double-click on the drag region toggles maximize.
   *  On macOS the Tauri shell already handles this natively
   *  (titleBarStyle: "Overlay" + decorations: true), so skip
   *  the manual call to avoid double-toggling. */
  const handleDoubleClick = () => {
    if (IS_MAC) return;
    getCurrentWindow().toggleMaximize().catch(() => {
      // Silently ignore on platforms that don't support maximize toggle.
    });
  };

  return (
    <header
      data-tauri-drag-region
      onDoubleClick={handleDoubleClick}
      className={cn(
        "relative z-50 flex h-10 shrink-0 select-none items-center border-b border-border bg-background text-foreground",
        // On macOS reserve space on the left for the traffic-light window
        // controls so the collapsed sidebar rail no longer collides with them.
        IS_MAC ? "pl-[78px]" : "pl-4",
      )}
    >
      {/* Centered app name — absolutely positioned so it stays dead-center
          regardless of left/right padding content width. pointer-events-none
          and select-none keep empty drag space and avoid text selection; the
          drag-region attr lets the window be dragged by the title text too. */}
      <span
        data-tauri-drag-region
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 select-none text-sm font-medium text-muted-foreground"
      >
        Prompt Manager
      </span>
    </header>
  );
}