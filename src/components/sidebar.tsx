import { Settings, Sparkles } from "lucide-react";
import { NAV_ITEMS, type ViewType } from "@/constants/nav";
import { ICON_MAP, Icon } from "@/components/ui/icon";

const IS_MAC = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);
import {
  Sidebar as SidebarShell,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";

export type { ViewType } from "@/constants/nav";

export interface SidebarCounts {
  prompts: number;
  agents: number;
  skills: number;
  favorites: number;
  categories: number;
  tags: number;
  trash: number;
}

interface SidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  /** Opens the global search overlay (Cmd/Ctrl+K). */
  onOpenSearch: () => void;
  counts: SidebarCounts;
}

export function Sidebar({ activeView, onViewChange, onOpenSearch, counts }: SidebarProps) {
  const countFor = (id: string): number | null => {
    switch (id) {
      case "prompts": return counts.prompts;
      case "agents": return counts.agents;
      case "skills": return counts.skills;
      case "favorites": return counts.favorites;
      case "categories": return counts.categories;
      case "tags": return counts.tags;
      case "trash": return counts.trash;
      default: return null;
    }
  };

  return (
    <SidebarShell collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">PromptHub</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {/* Global search trigger — styled as a search field (button) opening the command palette. */}
          <SidebarMenu className="mb-3">
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={onOpenSearch}
                tooltip="Search everything"
                aria-label="Search everything"
                aria-keyshortcuts={IS_MAC ? "Meta+K" : "Control+K"}
                variant="outline"
                className="h-9 gap-2.5 rounded-md border border-sidebar-border bg-muted px-2.5 text-muted-foreground shadow-none hover:border-border hover:bg-muted/80 hover:text-muted-foreground hover:shadow-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 active:border-border active:bg-muted/70"
              >
                <Icon name="search" className="size-4 shrink-0" />
                <span className="flex-1 truncate text-left text-sm">Search everything...</span>
                <kbd className="pointer-events-none ml-auto inline-flex h-5 shrink-0 items-center rounded-sm border border-border bg-muted-foreground/10 px-1.5 font-mono text-[10px] font-semibold text-muted-foreground">
                  {IS_MAC ? "⌘K" : "Ctrl K"}
                </kbd>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          {/* Subtle divider: separates the search zone from the nav list. */}
          <SidebarSeparator className="mb-3 mt-2" />

          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const NavIcon = ICON_MAP[item.icon];
                const count = countFor(item.id);
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={activeView === item.id}
                      onClick={() => onViewChange(item.id)}
                      tooltip={item.label}
                    >
                      <NavIcon />
                      <span>{item.label}</span>
                      {count !== null && count >= 0 && (
                        <SidebarMenuBadge>{count}</SidebarMenuBadge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={activeView === "settings"}
              onClick={() => onViewChange("settings")}
              tooltip="Settings"
            >
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </SidebarShell>
  );
}
