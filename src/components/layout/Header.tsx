import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

interface HeaderProps {
  searchQuery: string;
  onSearch: (query: string) => void;
  onCreatePrompt: () => void;
  onSearchFocus?: () => void;
  isSearchInteractive?: boolean;
}

export function Header({
  searchQuery,
  onSearch,
  onCreatePrompt,
  onSearchFocus,
  isSearchInteractive = true,
}: HeaderProps) {
  return (
    <header className="flex flex-col border-b bg-card shrink-0">
      {/* Top strip — spans full width, draggable, sits under the macOS traffic lights */}
      <div className="h-8 shrink-0" data-tauri-drag-region />

      {/* Main header row */}
      <div className="flex h-16 items-center justify-between px-6" data-tauri-drag-region>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Icon name="prompts" size="lg" className="text-primary" />
          </div>
          <div>
            <h1 className="text-headline tracking-tight">Prompt Manager</h1>
            <p className="text-caption text-muted-foreground">Manage your AI prompts efficiently</p>
          </div>
        </div>

        <div className="flex items-center gap-3" data-tauri-drag-region="false">
          <SearchBar
            value={searchQuery}
            onChange={isSearchInteractive ? onSearch : () => {}}
            placeholder="Search prompts..."
            onFocus={onSearchFocus}
          />
          <Button onClick={onCreatePrompt} className="gap-2">
            <Icon name="add" size="sm" />
            New Prompt
          </Button>
        </div>
      </div>
    </header>
  );
}
