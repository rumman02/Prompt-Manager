import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icon, ICON_PICKER_GROUPS, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

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

  const renderIconButton = (n: IconName) => (
    <button
      key={n}
      type="button"
      title={n}
      aria-label={n}
      onClick={() => pick(n)}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
        n === value
          ? "bg-primary/10 text-primary ring-1 ring-primary/40"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      )}
    >
      <Icon name={n} size="md" />
    </button>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        onClear ? (
          <Button variant="ghost" size="sm" onClick={() => { onClear(); onClose(); }}>
            Reset to default
          </Button>
        ) : undefined
      }
    >
      <Input
        autoFocus
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search icons…"
        className="mb-1"
      />

      <div className="max-h-[340px] overflow-y-auto pr-1 space-y-4">
        {query ? (
          results.length > 0 ? (
            <div>
              <p className="text-caption text-muted-foreground uppercase tracking-wide mb-1.5">
                Results
              </p>
              <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
                {results.map(renderIconButton)}
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No icons match “{search}”
            </p>
          )
        ) : (
          ICON_PICKER_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-caption text-muted-foreground uppercase tracking-wide mb-1.5">
                {group.label}
              </p>
              <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
                {group.icons.map(renderIconButton)}
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
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
}

export function IconPickerButton({
  value,
  onSelect,
  onClear,
  fallback,
  className,
  label,
}: IconPickerButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <button
        type="button"
        title="Change icon"
        aria-label="Change icon"
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-transparent hover:border-border transition-colors"
      >
        <Icon name={value ?? fallback ?? "file"} size="lg" />
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
