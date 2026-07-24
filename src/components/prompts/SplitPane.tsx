import { useCallback, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ResizeHandle } from "@/components/ui/resize-handle/resize-handle";

/// Split-pane layout system for the prompt editor.
///
/// Modeled on VS Code's editor splitting: a layout is a tree of splits. Each
/// leaf holds one of the four views (edit/preview/variables/history); each
/// internal node is a row or column of children with a resize handle between
/// neighbors. The user splits a pane (cloning its view into a new sibling) or
/// closes a pane, and toggles the orientation that *new* splits use.
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
  onSplit: () => void;
  onClose: () => void;
}

const VIEWS: { id: ViewId; label: string; icon: string }[] = [
  {
    id: "preview",
    label: "Preview",
    icon: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  },
  {
    id: "edit",
    label: "Edit",
    icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10",
  },
  {
    id: "variables",
    label: "Variables",
    icon: "M4.745 2.25h1.01m2.245 0h1.01m2.245 0h1.01m2.245 0h1.01m2.245 0h1.01M4.745 21.75h1.01m2.245 0h1.01m2.245 0h1.01m2.245 0h1.01m2.245 0h1.01M2.25 4.745v1.01m0 2.245v1.01m0 2.245v1.01m0 2.245v1.01m0 2.245v1.01m0 2.245v1.01M21.75 4.745v1.01m0 2.245v1.01m0 2.245v1.01m0 2.245v1.01m0 2.245v1.01m0 2.245v1.01",
  },
  {
    id: "history",
    label: "History",
    icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    id: "meta",
    label: "Meta",
    icon: "M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z M6 6h.008v.008H6V6z",
  },
];

function PaneTabStrip({ view, canClose, onSwitch, onSplit, onClose }: PaneTabStripProps) {
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
              "relative flex h-[30px] items-center gap-1.5 rounded-t-[8px] px-3 text-xs font-medium transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              "border border-b-0",
              active
                ? "border-border bg-card text-foreground z-10 shadow-[0_-1px_2px_rgba(0,0,0,0.04)] after:absolute after:left-0 after:-bottom-px after:h-0.5 after:w-full after:bg-card after:content-['']"
                : "border-transparent bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d={v.icon} />
            </svg>
            {v.label}
          </button>
        );
      })}
      <div className="ml-auto flex items-center gap-0.5 pb-[3px]">
        <button
          onClick={onSplit}
          title="Split pane"
          aria-label="Split pane"
          className="flex h-7 w-7 items-center justify-center rounded-[6px] text-muted-foreground transition-colors duration-150 hover:text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
        </button>
        {canClose && (
          <button
            onClick={onClose}
            title="Close pane"
            aria-label="Close pane"
            className="flex h-7 w-7 items-center justify-center rounded-[6px] text-muted-foreground transition-colors duration-150 hover:text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Orientation toggle (top-level control) ─────────────────────────────────

interface OrientationToggleProps {
  orientation: Orientation;
  onChange: (o: Orientation) => void;
}

export function OrientationToggle({ orientation, onChange }: OrientationToggleProps) {
  const options: { id: Orientation; label: string; icon: ReactNode }[] = [
    {
      id: "h",
      label: "Split vertically",
      icon: (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15" />
        </svg>
      ),
    },
    {
      id: "v",
      label: "Split horizontally",
      icon: (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15" />
        </svg>
      ),
    },
  ];
  return (
    <div
      role="group"
      aria-label="Split orientation"
      className="inline-flex h-8 items-center gap-0.5 rounded-[10px] border border-border bg-muted p-1 shadow-macos-inset"
    >
      {options.map((o) => {
        const active = o.id === orientation;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            title={o.label}
            aria-label={o.label}
            aria-pressed={active}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-[6px] transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              active
                ? "bg-background text-foreground shadow-macos-button"
                : "text-muted-foreground hover:text-foreground",
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
  onSplitPane: (path: number[]) => void;
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
  onSplitPane: (path: number[]) => void;
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
          onSplit={() => onSplitPane(path)}
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
  onSplitPane: (path: number[]) => void;
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
