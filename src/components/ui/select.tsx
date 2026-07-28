import * as React from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

/* macOS popover-style dropdown: rounded-sm (6px), subtle inner shadow, accent focus ring. */
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "flex h-8 w-full appearance-none rounded-sm border border-input bg-background px-3 py-1.5 pr-8 text-sm shadow-macos-inset ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-shadow duration-150",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <Icon
          name="chevronDown"
          size="sm"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-50"
        />
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
