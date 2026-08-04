import { useRef, useCallback, useMemo, type Ref, type TextareaHTMLAttributes } from "react";
import { cn, hashHue } from "@/lib/utils";

interface HighlightedTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "style"> {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  /** When true, the editor fills its container height (VS Code-style) instead
   *  of growing with content via resize-y. The textarea scrolls internally. */
  fill?: boolean;
  ref?: Ref<HTMLTextAreaElement>;
}

/**
 * Live inline syntax-highlighting for {{variable}} placeholders.
 *
 * A transparent textarea sits over a synchronized <pre> overlay that renders
 * matched {{tokens}} as accent-tinted pills. Scroll and selection are kept in
 * lockstep so typing feels native; only the visual layer is enhanced.
 *
 * The chrome follows the app's surface-elevation pattern: a transparent resting
 * border (width preserved for layout) over a bg-muted/40 filled box, with focus
 * shown by a 2px focus-within ring — the only focus affordance for the editor.
 * The token highlight styling lives in the shared app CSS (.var-token).
 *
 * Mirror-overlay invariants (breaking any one desyncs glyphs between the two
 * layers and the drift compounds down the document):
 *  - The <pre> backdrop and <textarea> share IDENTICAL typography: font-family,
 *    font-size, line-height, letter-spacing, white-space and overflow-wrap
 *    (Tailwind Preflight forces <pre> to monospace by default — that is the
 *    classic cause of whole-document drift — so font-family is pinned to the
 *    settings-driven editor font on BOTH layers explicitly).
 *  - Token chips add ZERO advance width: background/color/inset box-shadow
 *    only. No padding, margin, border, or inline-block (see .var-token).
 *  - Token spans must NOT be white-space:nowrap: the textarea wraps via
 *    overflow-wrap:break-word, so a nowrap chip would refuse a break the
 *    textarea takes and jump to a wrong line.
 *  - A trailing "\n" is dropped at the end of a <pre> block, collapsing the
 *    last line's height; a sentinel newline is appended so the final line
 *    stays in sync with the textarea.
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

  // Sentinel newline: <pre> collapses a trailing "\n" (block-ending newlines
  // render no line box), so append one to keep the last line's height in sync
  // with the textarea.
  const renderContent = value.endsWith("\n") ? value + "\n" : value;

  // Split into literal runs + tokens, rendering each token as a per-name-tinted
  // inline pill. React escapes all text children, so prompt text containing
  // & < > cannot break the markup. Only the matched {{token}} substring is
  // highlighted; the raw characters are unchanged, so advance width is
  // identical to the plain text in the textarea.
  const renderHighlighted = useMemo(() => {
    const parts: React.ReactNode[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    let key = 0;
    tokenRe.lastIndex = 0;
    while ((m = tokenRe.exec(renderContent)) !== null) {
      if (m.index > last) parts.push(<span key={key++}>{renderContent.slice(last, m.index)}</span>);
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
    if (last <= renderContent.length) parts.push(<span key={key++}>{renderContent.slice(last)}</span>);
    return parts;
  }, [renderContent, tokenRe]);

  // The backdrop (highlight overlay) and the textarea are stacked in a single
  // CSS grid cell. Because neither is absolutely positioned, the textarea's
  // own height drives the wrapper's height — so the resize-y handle actually
  // grows/shrinks the whole control (and the panel scrolls to absorb it)
  // instead of being capped by a fixed parent height.
  return (
    <div
      className={cn(
        "focus-within:ring-offset-background relative w-full rounded-md border border-transparent bg-muted/40 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        fill ? "h-full overflow-hidden" : "overflow-auto",
        className,
      )}
    >
      <div className={cn("grid", fill && "h-full")}>
        {/* highlight backdrop — same cell as the textarea, scrolls with it.
            [font-family:var(--font-editor)] is mandatory: Tailwind Preflight
            would otherwise force <pre> to monospace while the textarea inherits
            var(--font-ui), and every glyph would advance at a different width. */}
        <pre
          ref={backdropRef}
          aria-hidden
          className={cn(
            "pointer-events-none m-0 w-full whitespace-pre-wrap break-words px-3 py-2 text-[13.5px] leading-[1.65] text-transparent [font-family:var(--font-editor)] [grid-area:1/1]",
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
            "m-0 w-full whitespace-pre-wrap break-words bg-transparent px-3 py-2 text-[13.5px] leading-[1.65] text-foreground outline-none placeholder:text-muted-foreground [font-family:var(--font-editor)] [grid-area:1/1]",
            fill ? "resize-none h-full overflow-auto" : "resize-y",
          )}
        />
      </div>
    </div>
  );
};
