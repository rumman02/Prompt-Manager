import { useEffect } from "react";
import { Settings } from "lucide-react";
import { NAV_ITEMS, type ViewType } from "@/constants/nav";
import { ICON_MAP } from "@/components/ui/icon";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (view: ViewType) => void;
}

export function CommandPalette({ open, onOpenChange, onNavigate }: CommandPaletteProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {NAV_ITEMS.map((item) => {
            const NavIcon = ICON_MAP[item.icon];
            return (
              <CommandItem
                key={item.id}
                value={item.label}
                onSelect={() => {
                  onNavigate(item.id);
                  onOpenChange(false);
                }}
              >
                <NavIcon />
                <span>{item.label}</span>
              </CommandItem>
            );
          })}
          <CommandItem
            value="Settings"
            onSelect={() => {
              onNavigate("settings");
              onOpenChange(false);
            }}
          >
            <Settings />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
