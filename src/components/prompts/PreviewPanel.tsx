import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { compilePrompt, VARIABLE_TOKEN_RE, type CompileResult } from "@/lib/utils";
import { ResizeHandle } from "@/components/ui/resize-handle/resize-handle";
import { toast } from "sonner";

interface PreviewPanelProps {
  content: string;
  /** Saved variable values keyed by name. Draft (in-progress) values are merged
   *  in by the parent, so typing in the Variables panel is reflected live. */
  variableValues: Record<string, string>;
  /** Mirror of VariablesSidebar's collapsed/width/resize props so this panel
   *  occupies the exact same slot and shares its persisted width. */
  collapsed: boolean;
  onToggle: () => void;
  width: number;
  onResizeStart: (e: React.MouseEvent) => void;
  isResizing: boolean;
}

// Same deterministic hue as the editor overlay, so a given name maps to the
// same color in edit and preview — the token you're filling is traceable.
function hashHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return h % 330;
}

// Split compiled text into runs. Unfilled {{name}} tokens become highlighted
// .var-token--empty spans; everything else is literal text. We walk the regex
// manually (not String.replace) so we can attach per-token keys + styles.
function renderCompiled(
  text: string,
  unfilledSet: Set<string>,
): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  VARIABLE_TOKEN_RE.lastIndex = 0;
  while ((m = VARIABLE_TOKEN_RE.exec(text)) !== null) {
    if (m.index > last) parts.push(<span key={key++}>{text.slice(last, m.index)}</span>);
    const name = m[1];
    const isEmpty = unfilledSet.has(name);
    parts.push(
      <span
        key={key++}
        className={isEmpty ? "var-token--empty" : "var-token"}
        style={isEmpty ? undefined : ({ ["--token-hue" as string]: `${hashHue(name)}deg` })}
        title={isEmpty ? "No value set — this placeholder was copied as-is" : `Value for {{${name}}}`}
      >
        {m[0]}
      </span>
    );
    last = VARIABLE_TOKEN_RE.lastIndex;
  }
  if (last <= text.length) parts.push(<span key={key++}>{text.slice(last)}</span>);
  return parts;
}

export function PreviewPanel({
  content,
  variableValues,
  collapsed,
  onToggle,
  width,
  onResizeStart,
  isResizing,
}: PreviewPanelProps) {
  const [copied, setCopied] = useState(false);

  const { text, unfilled }: CompileResult = useMemo(
    () => compilePrompt(content, variableValues),
    [content, variableValues],
  );
  const unfilledSet = useMemo(() => new Set(unfilled), [unfilled]);

  const rendered = useMemo(
    () => renderCompiled(text, unfilledSet),
    [text, unfilledSet],
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for non-secure contexts: hidden textarea + execCommand.
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    // Non-blocking heads-up: copy always succeeds, but if anything is unfilled
    // the user should know the {{placeholders} made it onto their clipboard.
    if (unfilled.length > 0) {
      toast(
        unfilled.length === 1
          ? "Copied with 1 unfilled variable"
          : `Copied with ${unfilled.length} unfilled variables`,
      );
    } else {
      toast.success("Copied to clipboard");
    }
  }, [text, unfilled.length]);

  // Collapsed: slim icon bar mirroring VariablesSidebar's collapsed mode.
  if (collapsed) {
    return (
      <div className="flex h-full w-14 shrink-0 flex-col items-center border-l bg-card py-3">
        <button
          onClick={onToggle}
          title="Expand preview"
          className="flex h-10 w-10 flex-col items-center justify-center gap-0.5 rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {unfilled.length > 0 && (
            <span className="text-[10px] font-medium leading-none text-amber-500">
              {unfilled.length}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn("flex h-full shrink-0 flex-row border-l bg-card", isResizing && "select-none")}
      style={{ width }}
    >
      <ResizeHandle side="right" onMouseDown={onResizeStart} isActive={isResizing} />
      <div className="flex flex-1 min-w-0 flex-col">
        {/* Header — Copy action lives here, always visible, not buried. */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-semibold">Preview</span>
          </div>
          <div className="flex items-center gap-1.5">
            {unfilled.length > 0 && (
              <span
                className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600"
                title="Unfilled variables are copied as {{name}}"
              >
                {unfilled.length} unfilled
              </span>
            )}
            <button
              onClick={onToggle}
              title="Collapse preview"
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* Copy bar */}
        <div className="border-b px-4 py-2.5">
          <Button
            size="sm"
            className="w-full gap-1.5"
            onClick={handleCopy}
            aria-label={copied ? "Copied to clipboard" : "Copy compiled prompt"}
          >
            {copied ? (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
                Copy compiled prompt
              </>
            )}
          </Button>
          {unfilled.length > 0 && (
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              {unfilled.length === 1
                ? "1 variable is unfilled — its {{placeholder}} will be copied as-is."
                : `${unfilled.length} variables are unfilled — their {{placeholders}} will be copied as-is.`}
            </p>
          )}
        </div>

        {/* Compiled output — read-only, monospace, whitespace preserved.
            Looks like the code-zone so the edit→preview transition feels
            continuous; not a textarea since this is read-only + copyable. */}
        <div className="flex-1 overflow-auto">
          <div className="code-zone relative m-3 rounded-md border border-[hsl(var(--code-border))] bg-[hsl(var(--code-bg))]">
            <pre
              aria-label="Compiled prompt preview"
              className="m-0 whitespace-pre-wrap break-words px-3 py-2.5 text-[13.5px] leading-[1.65] text-[hsl(var(--foreground))]"
            >
              {rendered}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
