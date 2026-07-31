import * as React from "react";
import { useEffect, useRef, useState, type JSX } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

/**
 * Custom in-app dropdown replacing native selection elements.
 * Renders a button trigger styled like the legacy select, with an
 * absolutely-positioned listbox panel, outside-click/Escape dismissal and
 * full keyboard navigation (ArrowUp/ArrowDown/Enter/Escape).
 */
export function Dropdown(props: DropdownProps): JSX.Element {
  const { value, onChange, options, placeholder, className, id, disabled } = props;

  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;
  const triggerLabel =
    selected ? selected.label : value !== "" ? value : placeholder ?? "";

  const close = () => {
    setOpen(false);
    setHighlightedIndex(-1);
  };

  // Close on outside click and on Escape.
  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        close();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // Keep the highlighted option scrolled into view while arrow-keying.
  useEffect(() => {
    if (!open || highlightedIndex < 0) return;
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${highlightedIndex}"]`
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [open, highlightedIndex]);

  const openDropdown = () => {
    if (disabled) return;
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const selectOption = (option: DropdownOption) => {
    onChange(option.value);
    close();
  };

  const moveHighlight = (dir: 1 | -1) => {
    if (options.length === 0) return;
    setHighlightedIndex((prev) => {
      if (prev < 0) return dir === 1 ? 0 : options.length - 1;
      return (prev + dir + options.length) % options.length;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) openDropdown();
        else moveHighlight(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) openDropdown();
        else moveHighlight(-1);
        break;
      case "Enter":
        if (open) {
          e.preventDefault();
          const opt =
            highlightedIndex >= 0 && highlightedIndex < options.length
              ? options[highlightedIndex]
              : undefined;
          if (opt) selectOption(opt);
        }
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          close();
        }
        break;
    }
  };

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? close() : openDropdown())}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex h-8 w-full items-center justify-between rounded-sm border border-input bg-background px-3 py-1.5 text-sm shadow-macos-inset ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-shadow duration-150",
          className
        )}
      >
        <span className="truncate text-left">{triggerLabel}</span>
        <Icon name="chevronDown" size="sm" className="ml-2 flex-shrink-0 opacity-50" />
      </button>

      {open && (
        <div
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-64 overflow-auto rounded-lg border bg-popover p-1 shadow-lg"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isHighlighted = index === highlightedIndex;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                data-index={index}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => selectOption(option)}
                className={cn(
                  "w-full rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-muted transition-colors",
                  isSelected && "bg-muted font-medium"
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
