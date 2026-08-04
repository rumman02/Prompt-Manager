import { type ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

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

export function PageHeader({ icon, title, subtitle, actions, backButton }: PageHeaderProps) {
  return (
    <div className="flex shrink-0 flex-col pb-4 bg-card">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          {backButton && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={backButton.onClick}
              aria-label={backButton.label}
              title={backButton.label}
              className="cursor-pointer"
            >
              <Icon name="back" size="md" />
            </Button>
          )}
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Icon name={icon} size="lg" className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
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
