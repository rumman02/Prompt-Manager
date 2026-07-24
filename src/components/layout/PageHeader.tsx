import { type ReactNode } from "react";

interface PageHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  actions?: ReactNode;
  // Optional back affordance. When provided, replaces the decorative icon with
  // an interactive button that returns the user to their previous view.
  backButton?: {
    label: string;
    onClick: () => void;
  };
}

/* macOS toolbar-style header: large title, subtle surface, back button. */
export function PageHeader({ icon, title, subtitle, actions, backButton }: PageHeaderProps) {
  return (
    <div className="flex flex-col bg-card shrink-0">
      {/* Top strip — spans full width, draggable, sits under the macOS traffic lights */}
      <div className="h-8 shrink-0" data-tauri-drag-region />

      {/* Main header row */}
      <div className="flex h-16 items-center justify-between px-6" data-tauri-drag-region>
        <div className="flex items-center gap-3">
          {backButton && (
            <button
              type="button"
              onClick={backButton.onClick}
              aria-label={backButton.label}
              title={backButton.label}
              className="flex h-8 w-8 items-center justify-center rounded-[8px] hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-1 cursor-pointer"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary/10">
            {icon}
          </div>
          <div>
            <h1 className="text-headline font-semibold tracking-tight">{title}</h1>
            <p className="text-caption text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-3" data-tauri-drag-region="false">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
