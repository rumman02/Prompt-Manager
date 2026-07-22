import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  searchQuery: string;
  onSearch: (query: string) => void;
  viewMode: "list" | "grid";
  onViewModeChange: (mode: "list" | "grid") => void;
  onCreatePrompt: () => void;
}

export function Header({
  searchQuery,
  onSearch,
  viewMode,
  onViewModeChange,
  onCreatePrompt,
}: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
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
          <h1 className="text-lg font-semibold tracking-tight">Prompt Manager</h1>
          <p className="text-xs text-muted-foreground">Manage your AI prompts efficiently</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <SearchBar
          value={searchQuery}
          onChange={onSearch}
          placeholder="Search prompts..."
        />
        <div className="flex items-center gap-1 rounded-md border bg-muted/30 p-1">
          <button
            onClick={() => onViewModeChange("list")}
            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
              viewMode === "list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            List
          </button>
          <button
            onClick={() => onViewModeChange("grid")}
            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
              viewMode === "grid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Grid
          </button>
        </div>
        <Button onClick={onCreatePrompt} className="gap-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Prompt
        </Button>
      </div>
    </header>
  );
}
