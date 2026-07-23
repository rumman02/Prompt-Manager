import { useCallback, useEffect, useRef, useState } from "react";

export type ResizeSide = "left" | "right";

interface UseResizableOptions {
  /** Initial width in pixels. */
  initial: number;
  /** Minimum width in pixels (clamped). */
  min?: number;
  /** Maximum width in pixels (clamped). */
  max?: number;
  /** Which edge the handle sits on — flips the drag delta sign. */
  side: ResizeSide;
}

interface UseResizableReturn {
  width: number;
  /** Attach this to the handle's onMouseDown. */
  onResizeStart: (e: React.MouseEvent) => void;
  isResizing: boolean;
}

/**
 * Drag-to-resize logic for a split-pane sidebar. Tracks width in a ref so
 * dragging stays smooth (no re-render per mousemove), then commits to state
 * on mouseup. The body cursor and text-selection are locked during the drag.
 */
export function useResizable({
  initial,
  min = 160,
  max = 560,
  side,
}: UseResizableOptions): UseResizableReturn {
  const widthRef = useRef(initial);
  const [width, setWidth] = useState(initial);
  const [isResizing, setIsResizing] = useState(false);

  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = widthRef.current;
      // Right-side handle: dragging right shrinks, so the delta is inverted.
      const sign = side === "left" ? 1 : -1;

      setIsResizing(true);

      const onMove = (moveEvent: MouseEvent) => {
        const next = startWidth + sign * (moveEvent.clientX - startX);
        const clamped = Math.min(max, Math.max(min, next));
        widthRef.current = clamped;
        setWidth(clamped);
      };

      const onUp = () => {
        setIsResizing(false);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [max, min, side]
  );

  // Safety net: if the component unmounts mid-drag, release listeners.
  useEffect(() => {
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  return { width, onResizeStart, isResizing };
}
