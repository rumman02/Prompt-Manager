import { useRef, useCallback, useMemo, type Ref, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface HighlightedTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "style"> {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  /** When true, the editor fills its container height (VS Code-style) instead
   *  of growing with content via resize-y. The textarea scrolls internally. */
  fill?: boolean;
  ref?: Ref<HTMLTextAreaElement>;
}

// Deterministic hash → hue. Same variable name always maps to the same color,
// so {{audience}}, {{audiences}}, {{audiencez}} read as distinct, traceable tokens.
function hashHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  // spread across the wheel but avoid the amber reserved for --accent-2 (≈32)
  return h % 330;
}

/**
 * Live inline syntax-highlighting for {{variable}} placeholders.
 *
 * A transparent textarea sits over a synchronized <pre> overlay that renders
 * matched {{tokens}} as accent-tinted pills. Scroll and selection are kept in
 * lockstep so typing feels native; only the visual layer is enhanced.
 *
 * Note on padding: tokens use inset box-shadow for their border, NOT horizontal
 * padding. Any inline padding changes a span's width and would break the pixel
 * alignment between the backdrop overlay and the textarea on top of it.
 */
export const HighlightedTextarea = ({ value, onChange, className, fill, ref, ...rest }: HighlightedTextareaProps) => {
  const backdropRef = useRef<HTMLPreElement>(null);

  const handleScroll = useCallback(() => {
    const backdrop = backdropRef.current;
    const textarea = ref && "current" in ref ? ref.current : null;
    if (backdrop && textarea) {
      backdrop.scrollTop = textarea.scrollTop;
      backdrop.scrollLeft = textarea.scrollLeft;
    }
  }, [ref]);

  const tokenRe = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;

  // Split into literal runs + tokens, rendering each token as a per-name-tinted
  // inline pill. white-space:nowrap keeps a token from breaking mid-word.
  const renderHighlighted = useMemo(() => {
    const parts: React.ReactNode[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    let key = 0;
    tokenRe.lastIndex = 0;
    while ((m = tokenRe.exec(value)) !== null) {
      if (m.index > last) parts.push(<span key={key++}>{value.slice(last, m.index)}</span>);
      const name = m[1];
      parts.push(
        <span
          key={key++}
          className="var-token"
          style={{ ["--token-hue" as string]: `${hashHue(name)}deg` }}
        >
          {m[0]}
        </span>
      );
      last = tokenRe.lastIndex;
    }
    if (last <= value.length) parts.push(<span key={key++}>{value.slice(last)}</span>);
    return parts;
  }, [value]);

  // The backdrop (highlight overlay) and the textarea are stacked in a single
  // CSS grid cell. Because neither is absolutely positioned, the textarea's
  // own height drives the wrapper's height — so the resize-y handle actually
  // grows/shrinks the whole control (and the panel scrolls to absorb it)
  // instead of being capped by a fixed parent height.
  return (
    <div
      className={cn(
        "code-zone relative w-full rounded-[6px] border border-[hsl(var(--code-border))] bg-[hsl(var(--code-bg))]",
        fill ? "h-full overflow-hidden" : "overflow-auto",
        className,
      )}
    >
      <div className={cn("grid", fill && "h-full")}>
        {/* highlight backdrop — same cell as the textarea, scrolls with it */}
        <pre
          ref={backdropRef}
          aria-hidden
          className={cn(
            "pointer-events-none m-0 whitespace-pre-wrap break-words px-3 py-2.5 text-[13.5px] leading-[1.65] text-transparent [grid-area:1/1]",
            fill && "h-full overflow-hidden",
          )}
        >
          {renderHighlighted}
        </pre>
        {/* actual input, layered on top. In fill mode it fills the container
            and scrolls internally; otherwise resize-y grows the textarea. */}
        <textarea
          {...rest}
          ref={ref}
          value={value}
          onScroll={handleScroll}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className={cn(
            "code-zone m-0 w-full whitespace-pre-wrap break-words bg-transparent px-3 py-2.5 text-[13.5px] leading-[1.65] text-foreground outline-none placeholder:text-muted-foreground [grid-area:1/1]",
            fill ? "resize-none h-full overflow-auto" : "resize-y",
          )}
        />
      </div>
    </div>
  );
};
