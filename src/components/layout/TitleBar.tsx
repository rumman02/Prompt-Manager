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
        "relative z-50 flex h-10 shrink-0 select-none items-center border-b border-border/60 bg-background text-foreground",
        // macOS: traffic lights are inset to x=18 via trafficLightPosition
        // in tauri.conf.json, aligning with the sidebar content column;
        // the centered title is absolutely positioned so no padding is
        // needed to dodge them. Non-Mac gets the same minimal spacing.
        "pl-4",
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