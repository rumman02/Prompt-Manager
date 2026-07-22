import * as React from "react";
import { cn } from "@/lib/utils";

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
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      )}
      <nav className="flex items-center gap-1.5 text-sm">
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
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
