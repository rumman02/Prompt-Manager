import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/constants/nav";
import { Icon, type IconName } from "@/components/ui/icon";
import type { CategoryCount } from "@/types";

export type ViewType = "dashboard" | "prompts" | "agents" | "skills" | "favorites" | "categories" | "tags" | "trash" | "settings";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  categories: CategoryCount[];
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
  counts: {
    prompts: number;
    agents: number;
    skills: number;
    favorites: number;
    categories: number;
    tags: number;
    trash: number;
  };
}

/* macOS native sidebar: source-list style with rounded selection highlight
   (accent tint), consistent icon system, section headers. */
export function Sidebar({
  collapsed,
  onToggle,
  activeView,
  onViewChange,
  categories,
  selectedCategory,
  onCategorySelect,
  counts,
}: SidebarProps) {
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
    <aside
      className={cn(
        "flex flex-col border-r bg-secondary/80 backdrop-blur-xl transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Traffic light spacer — draggable, keeps logo/collapse clear of macOS window controls */}
      <div className="h-8 shrink-0" data-tauri-drag-region />

      {/* Logo area — excluded from drag region (contains interactive collapse button) */}
      <div className="flex h-16 items-center justify-between px-4" data-tauri-drag-region="false">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Icon name="sparkles" size="sm" className="text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold tracking-tight">PromptHub</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors",
            collapsed && "mx-auto"
          )}
        >
          <Icon
            name={collapsed ? "sidebarOpen" : "sidebarClose"}
            size="md"
            className={cn("transition-transform", collapsed && "rotate-180")}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-auto p-3 space-y-6">
        {/* Main Navigation */}
        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onViewChange(item.id);
                if (item.id === "prompts") onCategorySelect(null);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                activeView === item.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon name={item.icon as IconName} size="md" className="flex-shrink-0" />
              {!collapsed && (
                <span className="flex-1 text-left">{item.label}</span>
              )}
              {!collapsed && (() => {
                const n = countFor(item.id);
                if (n === null || n < 0) return null;
                return (
                  <span className={cn(
                    "ml-auto inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
                    activeView === item.id
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {n}
                  </span>
                );
              })()}
            </button>
          ))}
        </div>

      </nav>

      {/* Settings */}
      <div className="p-3">
        <button
          onClick={() => onViewChange("settings")}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            activeView === "settings"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Settings" : undefined}
        >
          <Icon name="settings" size="md" className="flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </button>
      </div>
    </aside>
  );
}
