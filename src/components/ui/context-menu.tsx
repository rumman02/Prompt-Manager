/**
 * ContextMenu — reusable right-click (context) menu.
 *
 * Component form (chosen over the useContextMenu hook variant — the wrapper
 * keeps the positioning/cleanup self-contained at call sites, so consumers
 * only pass items + a trigger):
 *
 *   <ContextMenu items={[{ label, icon, destructive?, onClick }, ...]}>
 *     {trigger}
 *   </ContextMenu>
 *
 * • The wrapper ONLY handles onContextMenu (preventDefault + stopPropagation);
 *   normal left clicks pass straight through to the trigger.
 * • The menu is portaled to document.body, fixed at the cursor position,
 *   flipped up/left when it would overflow the window (mirrors ActionsMenu's
 *   getPos() math: width 176, height items.length * 36 + 16).
 * • Closes on outside mousedown, Escape, window blur, scroll (capture), or
 *   after any item click.
 * • Visual style matches ActionsMenu exactly: rounded-lg popover container
 *   (border bg-popover/90 backdrop-blur-xl p-1 shadow-lg), same item button
 *   classes, same destructive styling, same separator before the first
 *   destructive item. z-index 100.
 */

import {
  useEffect,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "@/components/ui/icon";

export interface ContextMenuItem {
  label: string;
  icon: IconName;
  destructive?: boolean;
  onClick: () => void;
}

export interface ContextMenuProps {
  items: ContextMenuItem[];
  children: ReactNode;
  className?: string;
}

export function ContextMenu({ items, children, className }: ContextMenuProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const close = () => setPos(null);

  const handleContextMenu = (e: ReactMouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPos({ x: e.clientX, y: e.clientY });
  };

  // Closes on outside mousedown, Escape, window blur, or scroll (capture).
  // Right-button mousedowns are ignored — they precede the contextmenu that
  // repositions the menu, so closing on them would cause a flicker.
  useEffect(() => {
    if (!pos) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (e.button === 0) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onScroll = () => close();
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("blur", close);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", close);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [pos]);

  const stop: React.MouseEventHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Mirror ActionsMenu's getPos(): clamp to the window (8px margin), and when
  // the menu would overflow the bottom, flip it above the cursor.
  const getPos = (): CSSProperties => {
    if (!pos) return {};
    const W = 176;
    const H = items.length * 36 + 16;
    let left = pos.x;
    let top = pos.y;
    if (left + W > window.innerWidth - 8) left = window.innerWidth - W - 8;
    if (left < 8) left = 8;
    if (top + H > window.innerHeight - 8) top = pos.y - H - 4;
    if (top < 8) top = 8;
    return { position: "fixed", left, top, zIndex: 100, minWidth: W };
  };

  /* insert separator before first destructive item */
  let seenSeparator = false;
  const rendered: ReactNode[] = [];
  items.forEach((item, i) => {
    if (item.destructive && !seenSeparator) {
      seenSeparator = true;
      rendered.push(<div key={`sep-${i}`} className="my-1 h-px bg-border" />);
    }
    rendered.push(
      <button
        key={`item-${i}`}
        onClick={(e) => {
          stop(e);
          close();
          item.onClick();
        }}
        className={`flex w-full items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-left text-subheadline transition-colors duration-150 ${
          item.destructive
            ? "text-destructive hover:bg-destructive/10"
            : "hover:bg-muted"
        }`}
      >
        <Icon name={item.icon} size="sm" className="shrink-0" />
        <span className="truncate">{item.label}</span>
      </button>,
    );
  });

  return (
    <div className={className} onContextMenu={handleContextMenu}>
      {children}
      {pos &&
        createPortal(
          <div
            onMouseDown={stop}
            style={getPos()}
            className="rounded-lg border border-border bg-popover/90 backdrop-blur-xl p-1 text-popover-foreground shadow-lg"
          >
            {rendered}
          </div>,
          document.body,
        )}
    </div>
  );
}
