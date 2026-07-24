import { useState, useRef, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ActionItem {
  label: string;
  icon: string;
  destructive?: boolean;
  onClick: () => void;
}

interface ActionsMenuProps {
  items: ActionItem[];
  children?: (ctx: { open: boolean; onToggle: () => void }) => ReactNode;
}

export function ActionsMenu({ items, children }: ActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const raf = requestAnimationFrame(() => {
      document.addEventListener("mousedown", onDocClick);
      document.addEventListener("keydown", onKey);
    });
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const stop: React.MouseEventHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleToggle = () => setOpen((v) => !v);

  const getPos = (): React.CSSProperties => {
    if (!wrapperRef.current) return {};
    const rect = wrapperRef.current.getBoundingClientRect();
    const W = 176;
    const H = items.length * 36 + 16;
    let left = rect.right - W;
    let top = rect.bottom + 4;
    if (left + W > window.innerWidth - 8) left = window.innerWidth - W - 8;
    if (left < 8) left = 8;
    if (top + H > window.innerHeight - 8) top = rect.top - H - 4;
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
          setOpen(false);
          item.onClick();
        }}
        className={`flex w-full items-center gap-2.5 rounded-[6px] px-2.5 py-1.5 text-left text-subheadline transition-colors duration-150 ${
          item.destructive
            ? "text-destructive hover:bg-destructive/10"
            : "hover:bg-muted"
        }`}
      >
        <svg
          className="h-3.5 w-3.5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
        </svg>
        <span className="truncate">{item.label}</span>
      </button>,
    );
  });

  return (
    <div ref={wrapperRef} className="inline-flex">
      {children?.({ open, onToggle: handleToggle }) ?? (
        <button
          onClick={(e) => {
            stop(e);
            handleToggle();
          }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted hover:text-foreground transition-all"
          title="Options"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
        </button>
      )}

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={getPos()}
            onMouseDown={stop}
            className="rounded-[10px] border border-border bg-popover/90 backdrop-blur-xl p-1 text-popover-foreground shadow-macos-popover"
          >
            {rendered}
          </div>,
          document.body,
        )}
    </div>
  );
}