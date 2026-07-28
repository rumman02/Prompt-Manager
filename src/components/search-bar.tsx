import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";

interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onFocus?: () => void;
}

/* macOS search field: rounded-lg (10px), magnifier icon, subtle bg, ⌘K shortcut. */
export function SearchBar({ value, onChange, placeholder = "Search...", autoFocus = false, onFocus }: SearchBarProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div
      className={`relative flex items-center transition-all ${
        focused ? "w-80" : "w-64"
      }`}
    >
      <Icon
        name="search"
        size="md"
        className="absolute left-3 text-muted-foreground pointer-events-none"
      />
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          setFocused(true);
          onFocus?.();
        }}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="pl-9 pr-16 h-8 text-sm rounded-lg"
      />
      {!focused && !value && (
        <kbd className="absolute right-3 inline-flex items-center gap-0.5 rounded-sm border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      )}
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-sm hover:bg-muted"
        >
          <Icon name="close" size="xs" />
        </button>
      )}
    </div>
  );
}
