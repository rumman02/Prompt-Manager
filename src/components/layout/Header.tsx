import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";

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
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary/10">
            <svg
              className="h-5 w-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
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
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Prompt
          </Button>
        </div>
      </div>
    </header>
  );
}
