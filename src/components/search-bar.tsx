import { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onFocus?: () => void;
}

export function SearchBar({ value, onChange, placeholder = "Search...", autoFocus = false, onFocus }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  return (
    <div className="relative flex items-center">
      <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        className="h-8 w-64 pl-9 pr-9 text-sm"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-1 h-6 w-6"
        >
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
