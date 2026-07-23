import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
  type Ref,
  forwardRef,
  useImperativeHandle,
} from "react";
import { createPortal } from "react-dom";
import type { PromptRow } from "@/types";

/* ─── icon paths (24×24 stroke icons) ─── */
const ICON = {
  star: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z",
  dots: "M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z",
  pencil: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10",
  copy: "M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75",
  trash: "M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0",
};

interface PromptActionsMenuProps {
  prompt: PromptRow;
  onEdit: (prompt: PromptRow) => void;
  onDelete: (id: number) => void;
  onDuplicate: (id: number) => void;
  onToggleFavorite?: (id: number) => void;
  /** className for the outer wrapper (controls hover visibility, sizing) */
  className?: string;
  /** render prop so the row controls its own hover visibility */
  children?: (ctx: {
    open: boolean;
    onContextMenu: (e: React.MouseEvent) => void;
  }) => ReactNode;
}

export interface PromptActionsMenuHandle {
  openContextMenu: (e: React.MouseEvent) => void;
}

/**
 * Reusable actions surface for a prompt row.
 *
 * Renders (on hover via the `children` render-prop) a single 3-dot button.
 * The 3-dot button opens a dropdown; a right-click anywhere on the row
 * opens the same menu at the cursor. Both are driven by this single component
 * so List and Grid views share identical behaviour.
 */
export const PromptActionsMenu = forwardRef<
  PromptActionsMenuHandle,
  PromptActionsMenuProps
>(function PromptActionsMenu(
  { prompt, onEdit, onDelete, onDuplicate, onToggleFavorite, className = "", children },
  ref,
) {
  const [open, setOpen] = useState(false);
  const [ctxPos, setCtxPos] = useState<{ x: number; y: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  /* open / close helpers */
  const openMenu = useCallback((anchor: { x: number; y: number }) => {
    setCtxPos(anchor);
    setOpen(true);
  }, []);
  const closeMenu = useCallback(() => {
    setOpen(false);
    setCtxPos(null);
  }, []);

  /* 3-dot button → dropdown anchored to the trigger button */
  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (open) {
      closeMenu();
      return;
    }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      openMenu({ x: rect.right, y: rect.bottom });
    }
  };

  /* right-click → context menu at the cursor */
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openMenu({ x: e.clientX, y: e.clientY });
  };

  /* expose right-click so the parent row can forward it */
  useImperativeHandle(ref, () => ({
    openContextMenu: (e: React.MouseEvent) => handleContextMenu(e),
  }));

  /* close on outside click or Escape */
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    /* rAF so the opening click doesn't immediately close it */
    const raf = requestAnimationFrame(() => {
      document.addEventListener("mousedown", onDocClick);
      document.addEventListener("keydown", onKey);
    });
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, closeMenu]);

  /* menu positioning: prefer right-aligned under trigger, flip if it overflows */
  const menuStyle = ((): React.CSSProperties => {
    if (!ctxPos) return {};
    const W = 176; // 11rem
    const H = 132; // approx max height
    let left = ctxPos.x;
    let top = ctxPos.y + 4;
    if (triggerRef.current && !ctxPos) {
      // dropdown mode: right-align to trigger
      const rect = triggerRef.current.getBoundingClientRect();
      left = rect.right - W;
      top = rect.bottom + 4;
    }
    // flip left if overflowing right edge
    if (left + W > window.innerWidth - 8) left = window.innerWidth - W - 8;
    if (left < 8) left = 8;
    // flip up if overflowing bottom
    if (top + H > window.innerHeight - 8) top = ctxPos.y - H - 4;
    return { position: "fixed", left, top, zIndex: 100, minWidth: W };
  })();

  const stop: React.MouseEventHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFavorite = (e: React.MouseEvent) => {
    stop(e);
    onToggleFavorite?.(prompt.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    stop(e);
    closeMenu();
    onEdit(prompt);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    stop(e);
    closeMenu();
    onDuplicate(prompt.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    stop(e);
    closeMenu();
    onDelete(prompt.id);
  };

  return (
    <div className={className} onContextMenu={handleContextMenu}>
      {children?.({ open, onContextMenu: handleContextMenu }) ?? (
        <DefaultActions
          onTriggerClick={handleTriggerClick}
          triggerRef={triggerRef}
        />
      )}

      {open &&
        ctxPos &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            onMouseDown={stop}
            className="rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg"
          >
            <MenuItem icon={ICON.pencil} onClick={handleEdit}>
              Edit
            </MenuItem>
            <MenuItem icon={ICON.copy} onClick={handleDuplicate}>
              Duplicate
            </MenuItem>
            <MenuItem
              icon={ICON.star}
              onClick={handleFavorite}
              iconProps={{
                fill: prompt.is_favorite ? "currentColor" : "none",
                stroke: prompt.is_favorite ? undefined : "currentColor",
                strokeWidth: prompt.is_favorite ? 0 : 2,
              }}
            >
              {prompt.is_favorite ? "Remove from Favorites" : "Add to Favorites"}
            </MenuItem>
            <div className="my-1 h-px bg-border" />
            <MenuItem icon={ICON.trash} onClick={handleDelete} destructive>
              Delete
            </MenuItem>
          </div>,
          document.body,
        )}
    </div>
  );
});

/* ─── default trigger (3-dot button flush-right) ─── */

function DefaultActions({
  onTriggerClick,
  triggerRef,
}: {
  onTriggerClick: (e: React.MouseEvent) => void;
  triggerRef: Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={triggerRef as React.RefObject<HTMLButtonElement>}
      onClick={onTriggerClick}
      className="flex h-8 w-8 shrink-0 items-center justify-center overflow-visible rounded-md text-foreground/80 hover:bg-accent hover:text-foreground transition-colors"
      title="More options"
    >
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d={ICON.dots} />
      </svg>
    </button>
  );
}

/* ─── menu row ─── */

function MenuItem({
  icon,
  onClick,
  children,
  destructive,
  iconProps,
}: {
  icon: string;
  onClick: (e: React.MouseEvent) => void;
  children: ReactNode;
  destructive?: boolean;
  iconProps?: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  };
}) {
  const isStar = iconProps?.fill !== undefined;
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
        destructive
          ? "text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
          : "hover:bg-muted focus:bg-muted"
      }`}
    >
      {isStar ? (
        <svg
          className="h-3.5 w-3.5 shrink-0"
          fill={iconProps.fill ?? "none"}
          viewBox="0 0 24 24"
          strokeWidth={iconProps.strokeWidth ?? 2}
          stroke={iconProps.stroke ?? "currentColor"}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      ) : (
        <svg
          className="h-3.5 w-3.5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      )}
      <span className="truncate">{children}</span>
    </button>
  );
}
