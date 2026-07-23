import { type ReactNode } from "react";

interface PageHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  actions?: ReactNode;
}

export function PageHeader({ icon, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col bg-card shrink-0">
      {/* Top strip — spans full width, draggable, sits under the macOS traffic lights */}
      <div className="h-8 shrink-0" data-tauri-drag-region />

      {/* Main header row */}
      <div className="flex h-16 items-center justify-between px-6" data-tauri-drag-region>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            {icon}
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

