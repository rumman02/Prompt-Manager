import { Settings, Sparkles } from "lucide-react";
import { NAV_ITEMS, type ViewType } from "@/constants/nav";
import { ICON_MAP } from "@/components/ui/icon";
import {
  Sidebar as SidebarShell,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
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
  counts: SidebarCounts;
}

export function Sidebar({ activeView, onViewChange, counts }: SidebarProps) {
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
        {/* Traffic light spacer — draggable, keeps logo clear of macOS window controls */}
        <div className="h-8 shrink-0" data-tauri-drag-region />

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
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
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
