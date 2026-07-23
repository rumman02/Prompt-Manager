import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { cn, formatDate } from "@/lib/utils";
import { NAV_ITEMS } from "@/constants/nav";
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
}

export function Sidebar({
  collapsed,
  onToggle,
  activeView,
  onViewChange,
  categories,
  selectedCategory,
  onCategorySelect,
}: SidebarProps) {
  useEffect(() => {
    const fetchTrashCount = async () => {
      try {
        await invoke<number>("get_trash_count");
      } catch {
        // Ignore errors
      }
    };
    fetchTrashCount();
  }, []);

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Traffic light spacer — draggable, keeps logo/collapse clear of macOS window controls */}
      <div className="h-8 shrink-0" data-tauri-drag-region />

      {/* Logo area — excluded from drag region (contains interactive collapse button) */}
      <div className="flex h-16 items-center justify-between px-4" data-tauri-drag-region="false">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <svg className="h-4 w-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
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
          <svg
            className={cn("h-4 w-4 transition-transform", collapsed ? "rotate-180" : "")}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-auto p-3 space-y-6">
        {/* Main Navigation */}
        <div className="space-y-1">
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
              <svg className="h-[18px] w-[18px] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {!collapsed && <span>{item.label}</span>}
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
          <svg className="h-[18px] w-[18px] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {!collapsed && <span>Settings</span>}
        </button>
      </div>
    </aside>
  );
}

