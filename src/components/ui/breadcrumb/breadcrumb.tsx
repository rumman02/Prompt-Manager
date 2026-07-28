import * as React from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onBack?: () => void;
  className?: string;
}

export function Breadcrumb({ items, onBack, className }: BreadcrumbProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {onBack && (
        <button
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-md border bg-background hover:bg-muted transition-colors"
          title="Go back"
        >
          <Icon name="back" size="md" />
        </button>
      )}
      <nav className="flex items-center gap-1.5 text-sm">
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <Icon name="chevronRight" size="sm" className="text-muted-foreground" />
            )}
            {item.onClick ? (
              <button
                onClick={item.onClick}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </button>
            ) : (
              <span className="font-medium text-foreground">{item.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>
    </div>
  );
}
