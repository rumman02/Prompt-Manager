import { useCallback, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/icon";
import { ResizeHandle } from "@/components/ui/resize-handle/resize-handle";

/// Split-pane layout system for the prompt editor.
///
/// Modeled on VS Code's editor splitting: a layout is a tree of splits. Each
/// leaf holds one of the four views (edit/preview/variables/history); each
/// internal node is a row or column of children with a resize handle between
/// neighbors. The user splits a pane (cloning its view into a new sibling) or
/// closes a pane, choosing the split orientation (vertical/horizontal)
/// per-click.
///
/// The layout is owned by the parent (PromptEditorPage) and persisted there;
/// this component is controlled — it reports intent via callbacks and renders
/// whatever tree it's handed.

export type ViewId = "edit" | "preview" | "variables" | "history" | "meta";
export type Orientation = "h" | "v";

/** A leaf: a pane showing one view. */
export interface Pane {
  kind: "pane";
  view: ViewId;
}
/** An internal node: a row/column of children. */
export interface Split {
  kind: "split";
  orientation: Orientation;
  /** Flex-basis ratios per child. Normalized on render so they always sum to 1. */
  sizes: number[];
  children: LayoutNode[];
}
export type LayoutNode = Pane | Split;

export function makePane(view: ViewId): Pane {
  return { kind: "pane", view };
}

export function makeSplit(
  orientation: Orientation,
  sizes: number[],
  children: LayoutNode[],
): Split {
  return { kind: "split", orientation, sizes, children };
}

/** Convenience: make a split with equal-sized children. */
export function makeSplitEven(
  orientation: Orientation,
  children: LayoutNode[],
): Split {
  const sizes = children.map(() => 1 / children.length);
  return { kind: "split", orientation, sizes, children };
}

// ─── Per-pane tab strip ────────────────────────────────────────────────────
// Each leaf shows a tab strip with one tab per available view; the active tab
// is the pane's current view. Switching tabs changes the leaf's view in-place
// (no split). A split button clones the pane; a close button removes it.

interface PaneTabStripProps {
  view: ViewId;
  canClose: boolean;
  onSwitch: (view: ViewId) => void;
  onSplitPane: (orientation: Orientation) => void;
  onClose: () => void;
}

const VIEWS: { id: ViewId; label: string; icon: IconName }[] = [
  { id: "preview", label: "Preview", icon: "eye" },
  { id: "meta", label: "Meta", icon: "file" },
  { id: "edit", label: "Edit", icon: "edit" },
  { id: "variables", label: "Variables", icon: "variable" },
  { id: "history", label: "History", icon: "history" },
];

function PaneTabStrip({
  view,
  canClose,
  onSwitch,
  onSplitPane,
  onClose,
}: PaneTabStripProps) {
  return (
    <div
      role="tablist"
      aria-label="Pane views"
      className="flex shrink-0 items-end gap-px bg-muted/40 px-1 pt-1"
    >
      {VIEWS.map((v) => {
        const active = v.id === view;
        return (
          <button
            key={v.id}
            role="tab"
            aria-selected={active}
            onClick={() => onSwitch(v.id)}
            title={v.label}
            className={cn(
              // Chrome-style tab: rounded top corners, flat bottom; active tab
              // lifts up and overlaps the content border so it visually connects
              // to the panel, inactive tabs sit slightly recessed/muted.
              "relative flex h-[30px] items-center gap-1.5 rounded-t-md px-3 text-xs font-medium transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              "border border-b-0",
              active
                ? "border-border bg-card text-foreground z-10 shadow-[0_-1px_2px_rgba(0,0,0,0.04)] after:absolute after:left-0 after:-bottom-px after:h-0.5 after:w-full after:bg-card after:content-['']"
                : "border-transparent bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            <Icon name={v.icon} size="sm" />
            {v.label}
          </button>
        );
      })}
      <div className="ml-auto flex items-center gap-0.5 pb-[3px]">
        <OrientationToggle onSplit={onSplitPane} />
        {canClose && (
          <button
            onClick={onClose}
            title="Close pane"
            aria-label="Close pane"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            <Icon name="close" size="sm" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Orientation toggle (top-level control) ─────────────────────────────────

interface OrientationToggleProps {
  onSplit: (orientation: Orientation) => void;
}

export function OrientationToggle({ onSplit }: OrientationToggleProps) {
  const options: { id: Orientation; label: string; icon: ReactNode }[] = [
    {
      id: "h",
      label: "Split vertically",
      icon: <Icon name="columns" size="sm" />,
    },
    {
      id: "v",
      label: "Split horizontally",
      icon: <Icon name="rows" size="sm" />,
    },
  ];
  return (
    <div
      role="group"
      aria-label="Split orientation"
      className="inline-flex items-center gap-0.5"
    >
      {options.map((o) => {
        return (
          <button
            key={o.id}
            onClick={() => onSplit(o.id)}
            title={o.label}
            aria-label={o.label}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            {o.icon}
          </button>
        );
      })}
    </div>
  );
}

// ─── The rendered tree ──────────────────────────────────────────────────────

interface SplitPaneProps {
  layout: LayoutNode;
  /** Total number of leaf panes — used to decide whether close is allowed. */
  paneCount: number;
  /** Render the content of a leaf showing the given view. */
  renderPane: (view: ViewId) => ReactNode;
  /** Mutations, fired upward to the parent which owns + persists the layout. */
  onSwitchView: (path: number[], view: ViewId) => void;
  onSplitPane: (path: number[], orientation: Orientation) => void;
  onClosePane: (path: number[]) => void;
  onResize: (path: number[], sizes: number[]) => void;
}

export function SplitPane({
  layout,
  paneCount,
  renderPane,
  onSwitchView,
  onSplitPane,
  onClosePane,
  onResize,
}: SplitPaneProps) {
  return (
    <div className="flex h-full min-h-0 flex-1">
      <Node
        node={layout}
        path={[]}
        paneCount={paneCount}
        renderPane={renderPane}
        onSwitchView={onSwitchView}
        onSplitPane={onSplitPane}
        onClosePane={onClosePane}
        onResize={onResize}
      />
    </div>
  );
}

interface NodeProps {
  node: LayoutNode;
  path: number[];
  paneCount: number;
  renderPane: (view: ViewId) => ReactNode;
  onSwitchView: (path: number[], view: ViewId) => void;
  onSplitPane: (path: number[], orientation: Orientation) => void;
  onClosePane: (path: number[]) => void;
  onResize: (path: number[], sizes: number[]) => void;
}

function Node({
  node,
  path,
  paneCount,
  renderPane,
  onSwitchView,
  onSplitPane,
  onClosePane,
  onResize,
}: NodeProps) {
  if (node.kind === "pane") {
    return (
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
        <PaneTabStrip
          view={node.view}
          canClose={paneCount > 1}
          onSwitch={(view) => onSwitchView(path, view)}
          onSplitPane={(orientation) => onSplitPane(path, orientation)}
          onClose={() => onClosePane(path)}
        />
        <div className="flex-1 overflow-auto border-t border-border">{renderPane(node.view)}</div>
      </div>
    );
  }

  // Internal split node. Normalize sizes to sum to 1, lay children out in a
  // row (orientation h) or column (v), with a resize handle between each pair.
  const total = node.sizes.reduce((a, b) => a + b, 0) || 1;
  const norm = node.sizes.map((s) => s / total);
  const axis = node.orientation === "h" ? "row" : "column";

  return (
    <div
      className="flex h-full min-h-0 min-w-0 flex-1"
      style={{ flexDirection: axis }}
    >
      {node.children.map((child, i) => (
        <SplitChild
          key={i}
          child={child}
          childPath={[...path, i]}
          size={norm[i]}
          isLast={i === node.children.length - 1}
          orientation={node.orientation}
          paneCount={paneCount}
          renderPane={renderPane}
          onSwitchView={onSwitchView}
          onSplitPane={onSplitPane}
          onClosePane={onClosePane}
          onResize={onResize}
          // The handle between child i and i+1 adjusts sizes[i] and sizes[i+1].
          onHandleDrag={(delta) => {
            const next = [...node.sizes];
            next[i] = Math.max(0.05, next[i] + delta);
            next[i + 1] = Math.max(0.05, next[i + 1] - delta);
            onResize(path, next);
          }}
        />
      ))}
    </div>
  );
}

interface SplitChildProps {
  child: LayoutNode;
  childPath: number[];
  size: number;
  isLast: boolean;
  orientation: Orientation;
  paneCount: number;
  renderPane: (view: ViewId) => ReactNode;
  onSwitchView: (path: number[], view: ViewId) => void;
  onSplitPane: (path: number[], orientation: Orientation) => void;
  onClosePane: (path: number[]) => void;
  onResize: (path: number[], sizes: number[]) => void;
  onHandleDrag: (delta: number) => void;
}

/** One child of a split, plus (if not last) the resize handle to its neighbor. */
function SplitChild({
  child,
  childPath,
  size,
  isLast,
  orientation,
  paneCount,
  renderPane,
  onSwitchView,
  onSplitPane,
  onClosePane,
  onResize,
  onHandleDrag,
}: SplitChildProps) {
  // Track the container's total size (px) so a drag delta can be converted to
  // a fraction of the split. We measure on drag start.
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;
      const totalPx =
        orientation === "h" ? container.clientWidth : container.clientHeight;
      if (totalPx <= 0) return;
      const startPx = e.clientX;
      const startPy = e.clientY;
      setIsResizing(true);

      const onMove = (me: MouseEvent) => {
        const movedPx = orientation === "h" ? me.clientX - startPx : me.clientY - startPy;
        onHandleDrag(movedPx / totalPx);
      };
      const onUp = () => {
        setIsResizing(false);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
      document.body.style.cursor = orientation === "h" ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [orientation, onHandleDrag],
  );

  return (
    <>
      <div
        ref={containerRef}
        className={cn("min-h-0 min-w-0", isResizing && "select-none")}
        style={{ flex: `${size} 1 0%` }}
      >
        <Node
          node={child}
          path={childPath}
          paneCount={paneCount}
          renderPane={renderPane}
          onSwitchView={onSwitchView}
          onSplitPane={onSplitPane}
          onClosePane={onClosePane}
          onResize={onResize}
        />
      </div>
      {!isLast && (
        <ResizeHandle
          side={orientation === "h" ? "right" : "bottom"}
          onMouseDown={onResizeStart}
          isActive={isResizing}
        />
      )}
    </>
  );
}
