import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onFocus?: () => void;
}

/* macOS search field: rounded-10, magnifier icon, subtle bg, ⌘K shortcut. */
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
      <svg
        className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>
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
        className="pl-9 pr-16 h-8 text-sm rounded-[10px]"
      />
      {!focused && !value && (
        <kbd className="absolute right-3 inline-flex items-center gap-0.5 rounded-[6px] border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      )}
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-[6px] hover:bg-muted"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
