import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { renderCompiledMarkdown } from "@/lib/markdown";
import type { RenderedMarkdown } from "@/lib/markdown";
import { copyToClipboard } from "@/lib/clipboard";
import { toast } from "sonner";
import { Icon } from "@/components/ui/icon";
import { PanelStatusBar } from "@/components/prompts/PanelStatusBar";

interface PreviewPanelProps {
  content: string;
  /** Saved variable values keyed by name. Draft (in-progress) values are merged
   *  in by the parent, so typing in the Variables panel is reflected live. */
  variableValues: Record<string, string>;
}

export function PreviewPanel({ content, variableValues }: PreviewPanelProps) {
  const [copied, setCopied] = useState(false);
  // false = rendered Markdown preview, true = raw compiled Markdown source.
  // Persists across re-renders so the user's choice sticks while editing.
  const [showRaw, setShowRaw] = useState(false);

  // One compile pass yields the raw text (for clipboard), the sanitized +
  // variable-highlighted HTML (for rendering), and the unfilled list (for the
  // counter / helper text). Markdown is rendered here; the Edit tab stays a
  // plain-text textarea over raw Markdown source.
  const { text, html, unfilled }: RenderedMarkdown = useMemo(
    () => renderCompiledMarkdown(content, variableValues),
    [content, variableValues],
  );

  const handleCopy = useCallback(async () => {
    const wrote = await copyToClipboard(text);
    if (!wrote) {
      toast.error("Couldn't copy to clipboard");
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);

    // Non-blocking heads-up: copy succeeded, but if anything is unfilled the user
    // should know the {{placeholders}} made it onto their clipboard.
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

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-card">
      {/* Helper text — top of the panel when variables are unfilled. Shares
          PanelStatusBar chrome with the Edit pane's stats bar so the two top
          bars align when sitting side-by-side. */}
      {unfilled.length > 0 && (
        <PanelStatusBar>
          <p>
            {unfilled.length === 1
              ? "1 variable is unfilled — its {{placeholder}} will be copied as-is."
              : `${unfilled.length} variables are unfilled — their {{placeholders}} will be copied as-is.`}
          </p>
        </PanelStatusBar>
      )}

      {/* Compiled output — Markdown rendered to sanitized HTML, with unfilled
          {{placeholders}} highlighted as dashed .var-token--empty pills. Body
          text uses the app's UI font (not monospace); only code spans/blocks do.
          The raw compiled Markdown (not this HTML) is what Copy puts on the clipboard.
          The copy button floats top-right over the content so it stays anchored to
          what it copies, not stranded in a header bar. The Raw/Formatted toggle
          sits flush left of the copy button — same row, same chrome. */}
      <div className="relative flex-1 overflow-auto">
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
          <Button
            size="sm"
            variant="secondary"
            className="bg-card/80 backdrop-blur"
            onClick={() => setShowRaw((v) => !v)}
            aria-pressed={showRaw}
            aria-label={showRaw ? "Show formatted preview" : "Show raw Markdown"}
          >
            {showRaw ? "Formatted" : "Raw"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="gap-1.5 bg-card/80 backdrop-blur"
            onClick={handleCopy}
            aria-label={copied ? "Copied to clipboard" : "Copy compiled prompt"}
          >
            {copied ? (
              <>
                <Icon name="check" size="sm" />
                Copied
              </>
            ) : (
              <>
                <Icon name="clipboard" size="sm" />
                Copy
              </>
            )}
          </Button>
        </div>
        {showRaw ? (
          <pre
            aria-label="Raw compiled Markdown"
            className="m-3 whitespace-pre-wrap rounded-xl bg-code-bg px-4 py-3 font-code text-sm leading-relaxed text-foreground"
          >
            {text}
          </pre>
        ) : (
          <div
            aria-label="Compiled prompt preview"
            className="markdown-preview m-3 rounded-xl bg-code-bg px-4 py-3"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>
    </div>
  );
}
