import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

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
///
/// Resizing is backed by shadcn's Resizable (react-resizable-panels v4): each
/// split node is a `ResizablePanelGroup` (orientation "horizontal" for an "h"
/// split, "vertical" for a "v" split) whose children are `ResizablePanel`s
/// separated by `ResizableHandle`s. Persisted fractional `sizes` are fed in as
/// percentage `defaultSize`s on mount; finished drags are reported back through
/// `onLayoutChanged` as a fresh fractional array, keeping the parent's
/// persistence contract (LayoutNode.sizes, 0..1 fractions) unchanged.

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
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
              "border border-b-0",
              active
                ? "z-10 border-border bg-card text-foreground shadow-sm after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-card after:content-['']"
                : "border-transparent bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
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
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            title="Close pane"
            aria-label="Close pane"
            className="h-7 w-7"
          >
            <Icon name="close" size="sm" />
          </Button>
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
  const options: { id: Orientation; label: string; icon: IconName }[] = [
    { id: "h", label: "Split vertically", icon: "columns" },
    { id: "v", label: "Split horizontally", icon: "rows" },
  ];
  return (
    <div
      role="group"
      aria-label="Split orientation"
      className="inline-flex items-center gap-0.5"
    >
      {options.map((o) => (
        <Button
          key={o.id}
          variant="ghost"
          size="icon"
          onClick={() => onSplit(o.id)}
          title={o.label}
          aria-label={o.label}
          className="h-7 w-7"
        >
          <Icon name={o.icon} size="sm" />
        </Button>
      ))}
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
        <div className="min-h-0 flex-1 overflow-hidden border-t border-border/60">
          {renderPane(node.view)}
        </div>
      </div>
    );
  }

  // Internal split node. Normalize sizes to sum to 1, lay children out as a
  // row (orientation h) or column (v) via a ResizablePanelGroup, with a
  // ResizableHandle between each pair. Persisted fractional sizes become
  // percentage defaultSizes; drags report the whole group back via
  // onLayoutChanged so the parent keeps normalized fractions.
  const total = node.sizes.reduce((a, b) => a + b, 0) || 1;
  const norm = node.sizes.map((s) => s / total);
  const axis = node.orientation === "h" ? "horizontal" : "vertical";

  return (
    <ResizablePanelGroup
      orientation={axis}
      className="h-full min-h-0 min-w-0 flex-1"
      onLayoutChanged={(layout) => {
        const next = node.children.map(
          (_, i) => (layout[String(i)] ?? norm[i] * 100) / 100,
        );
        onResize(path, next);
      }}
    >
      {node.children.map((child, i) => (
        <Fragment key={i}>
          <ResizablePanel
            id={String(i)}
            defaultSize={String(Math.round(norm[i] * 1000) / 10)}
            minSize="5"
            className="h-full min-h-0 min-w-0"
          >
            <Node
              node={child}
              path={[...path, i]}
              paneCount={paneCount}
              renderPane={renderPane}
              onSwitchView={onSwitchView}
              onSplitPane={onSplitPane}
              onClosePane={onClosePane}
              onResize={onResize}
            />
          </ResizablePanel>
          {i < node.children.length - 1 && <ResizableHandle withHandle />}
        </Fragment>
      ))}
    </ResizablePanelGroup>
  );
}
