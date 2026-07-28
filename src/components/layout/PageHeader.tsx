import { type ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icon";

interface PageHeaderProps {
  icon: IconName;
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
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-1 cursor-pointer"
            >
              <Icon name="back" size="md" />
            </button>
          )}
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Icon name={icon} size="lg" className="text-primary" />
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
