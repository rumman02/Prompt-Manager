import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon, ICON_PICKER_GROUPS, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface IconPickerProps {
  open: boolean;
  onClose: () => void;
  /** Currently selected icon, if any. */
  value?: IconName | null;
  /** Called with the chosen icon name. */
  onSelect: (icon: IconName) => void;
  /** Optional: shown when the user clears the icon back to default. */
  onClear?: () => void;
  title?: string;
}

export function IconPicker({
  open,
  onClose,
  value,
  onSelect,
  onClear,
  title = "Choose an icon",
}: IconPickerProps) {
  const [search, setSearch] = useState("");

  // Reset the search whenever the picker opens.
  useEffect(() => {
    if (open) setSearch("");
  }, [open]);

  const query = search.trim().toLowerCase();

  // Flat result set: matches the icon name or its group label.
  const results = useMemo(() => {
    if (!query) return [];
    const matched: IconName[] = [];
    const seen = new Set<IconName>();
    for (const group of ICON_PICKER_GROUPS) {
      const groupMatches = group.label.toLowerCase().includes(query);
      for (const n of group.icons) {
        if (groupMatches || n.toLowerCase().includes(query)) {
          if (!seen.has(n)) {
            seen.add(n);
            matched.push(n);
          }
        }
      }
    }
    return matched;
  }, [query]);

  const pick = (n: IconName) => {
    onSelect(n);
    onClose();
  };

  const renderIconItem = (n: IconName) => (
    <CommandItem key={n} value={n} onSelect={() => pick(n)} className="flex items-center gap-2">
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
          n === value
            ? "bg-primary/10 text-primary ring-1 ring-primary/40"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
        )}
      >
        <Icon name={n} size="md" />
      </span>
      <span className="text-sm">{n}</span>
    </CommandItem>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Command className="rounded-lg border">
          <CommandInput
            autoFocus
            value={search}
            onValueChange={setSearch}
            placeholder="Search icons…"
          />
          <ScrollArea className="max-h-[340px]">
            <CommandList>
              {query ? (
                results.length > 0 ? (
                  <CommandGroup heading="Results">{results.map(renderIconItem)}</CommandGroup>
                ) : (
                  <CommandEmpty>No icons match “{search}”</CommandEmpty>
                )
              ) : (
                ICON_PICKER_GROUPS.map((group) => (
                  <CommandGroup key={group.label} heading={group.label}>
                    {group.icons.map(renderIconItem)}
                  </CommandGroup>
                ))
              )}
            </CommandList>
          </ScrollArea>
        </Command>
        <DialogFooter>
          {onClear && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onClear();
                onClose();
              }}
            >
              Reset to default
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export interface IconPickerButtonProps {
  value?: IconName | null;
  onSelect: (icon: IconName) => void;
  onClear?: () => void;
  /** Icon rendered when value is null. */
  fallback?: IconName;
  className?: string;
  /** Optional label rendered next to the swatch. */
  label?: string;
  /** Accessible name for the trigger, e.g. "Change icon for Marketing". */
  ariaLabel?: string;
}

export function IconPickerButton({
  value,
  onSelect,
  onClear,
  fallback,
  className,
  label,
  ariaLabel,
}: IconPickerButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <button
        type="button"
        title={ariaLabel ?? "Change icon"}
        aria-label={ariaLabel ?? "Change icon"}
        onClick={() => setOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-transparent hover:border-border transition-colors shrink-0"
      >
        <Icon name={value ?? fallback ?? "file"} size="md" />
      </button>
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
      <IconPicker
        open={open}
        onClose={() => setOpen(false)}
        value={value}
        onSelect={onSelect}
        onClear={onClear}
      />
    </div>
  );
}
