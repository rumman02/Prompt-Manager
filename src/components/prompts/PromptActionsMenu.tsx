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
import { Icon, type IconName } from "@/components/ui/icon";
import type { PromptRow } from "@/types";
import { copyToClipboard } from "@/lib/clipboard";
import { toast } from "sonner";

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
    const H = 168; // approx max height
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

  const handleCopy = async (e: React.MouseEvent) => {
    stop(e);
    closeMenu();
    const wrote = await copyToClipboard(prompt.content);
    if (wrote) {
      toast.success("Copied to clipboard");
    } else {
      toast.error("Couldn't copy to clipboard");
    }
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
            className="rounded-lg border border-border bg-popover/90 backdrop-blur-xl p-1 text-popover-foreground shadow-lg"
          >
            <MenuItem icon="clipboard" onClick={handleCopy}>
              Copy
            </MenuItem>
            <MenuItem icon="edit" onClick={handleEdit}>
              Edit
            </MenuItem>
            <MenuItem icon="copy" onClick={handleDuplicate}>
              Duplicate
            </MenuItem>
            <MenuItem
              icon="star"
              onClick={handleFavorite}
              fill={prompt.is_favorite ? "currentColor" : "none"}
            >
              {prompt.is_favorite ? "Remove from Favorites" : "Add to Favorites"}
            </MenuItem>
            <div className="my-1 h-px bg-border" />
            <MenuItem icon="delete" onClick={handleDelete} destructive>
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
      className="flex h-7 w-7 shrink-0 items-center justify-center overflow-visible rounded-md text-foreground/70 hover:bg-muted hover:text-foreground transition-colors duration-150"
      title="More options"
    >
      <Icon name="more" size="md" />
    </button>
  );
}

/* ─── menu row ─── */

function MenuItem({
  icon,
  onClick,
  children,
  destructive,
  fill = "none",
}: {
  icon: IconName;
  onClick: (e: React.MouseEvent) => void;
  children: ReactNode;
  destructive?: boolean;
  fill?: "none" | "currentColor";
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-left text-subheadline transition-colors duration-150 ${
        destructive
          ? "text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
          : "hover:bg-muted focus:bg-muted"
      }`}
    >
      <Icon name={icon} size="sm" className="shrink-0" fill={fill} />
      <span className="truncate">{children}</span>
    </button>
  );
}
