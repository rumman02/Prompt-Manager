import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";

interface HeaderProps {
  title?: string;
  onOpenCommandPalette: () => void;
  onCreatePrompt: () => void;
}

export function Header({ title = "Prompt Manager", onOpenCommandPalette, onCreatePrompt }: HeaderProps) {
  return (
    <header className="flex shrink-0 flex-col border-b bg-card">
      {/* Top strip — spans full width, draggable, sits under the macOS traffic lights */}
      <div className="h-8 shrink-0" data-tauri-drag-region />

      {/* Main header row */}
      <div className="flex h-16 items-center gap-3 px-4" data-tauri-drag-region>
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="text-sm font-medium text-foreground">{title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="ml-auto flex items-center gap-2" data-tauri-drag-region="false">
          <Button variant="ghost" onClick={onOpenCommandPalette} className="gap-2 text-muted-foreground">
            <Search className="size-4" />
            <span className="hidden md:inline">Search</span>
            <kbd className="pointer-events-none inline-flex items-center gap-0.5 rounded-sm border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </Button>
          <Button onClick={onCreatePrompt} className="gap-2">
            <Plus className="size-4" />
            New Prompt
          </Button>
        </div>
      </div>
    </header>
  );
}
