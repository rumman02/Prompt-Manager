import { useRef, useCallback, useMemo, type Ref, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface HighlightedTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "style"> {
  value: string;
  onChange: (value: string) => void;
  className?: string;
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
export const HighlightedTextarea = ({ value, onChange, className, ref, ...rest }: HighlightedTextareaProps) => {
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

  return (
    <div className={cn("code-zone relative w-full overflow-hidden rounded-[6px] border border-code-border bg-code-bg", className)}>
      {/* thin accent rule on the left edge — marks this as the instrument */}
      <span className="pointer-events-none absolute inset-y-0 left-0 w-[3px] rounded-l-[6px] bg-[hsl(var(--code-accent)/0.55)]" aria-hidden />
      {/* highlight backdrop */}
      <pre
        ref={backdropRef}
        aria-hidden
        className="pointer-events-none m-0 whitespace-pre-wrap break-words px-3 py-2.5 text-[13.5px] leading-[1.65] text-transparent"
      >
        {renderHighlighted}
      </pre>
      {/* actual input, layered on top */}
      <textarea
        {...rest}
        ref={ref}
        value={value}
        onScroll={handleScroll}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="code-zone absolute inset-0 m-0 h-full w-full resize-y whitespace-pre-wrap break-words bg-transparent px-3 py-2.5 text-[13.5px] leading-[1.65] text-foreground outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
};
