import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { renderCompiledMarkdown } from "@/lib/markdown";
import type { RenderedMarkdown } from "@/lib/markdown";
import { toast } from "sonner";

interface PreviewPanelProps {
  content: string;
  /** Saved variable values keyed by name. Draft (in-progress) values are merged
   *  in by the parent, so typing in the Variables panel is reflected live. */
  variableValues: Record<string, string>;
}

export function PreviewPanel({ content, variableValues }: PreviewPanelProps) {
  const [copied, setCopied] = useState(false);

  // One compile pass yields the raw text (for clipboard), the sanitized +
  // variable-highlighted HTML (for rendering), and the unfilled list (for the
  // counter / helper text). Markdown is rendered here; the Edit tab stays a
  // plain-text textarea over raw Markdown source.
  const { text, html, unfilled }: RenderedMarkdown = useMemo(
    () => renderCompiledMarkdown(content, variableValues),
    [content, variableValues],
  );

  const handleCopy = useCallback(async () => {
    let wrote = false;
    try {
      // Primary path: Tauri's clipboard plugin works in the webview regardless
      // of secure-context restrictions that gate navigator.clipboard.
      const { writeText } = await import("@tauri-apps/plugin-clipboard-manager");
      await writeText(text);
      wrote = true;
    } catch (pluginErr) {
      // Plugin unavailable (e.g. running in a plain browser). Fall back to the
      // Web Clipboard API, then to the legacy textarea + execCommand hack for
      // non-secure contexts.
      console.warn("Tauri clipboard plugin unavailable, falling back:", pluginErr);
      try {
        await navigator.clipboard.writeText(text);
        wrote = true;
      } catch {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand("copy");
          wrote = true;
        } catch (execErr) {
          console.error("Clipboard execCommand fallback failed:", execErr);
        }
        document.body.removeChild(textarea);
      }
    }
    if (!wrote) {
      toast.error("Couldn't copy to clipboard");
      return;
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

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-card">
      {/* Copy bar — compact button + unfilled badge sit inline at the top of the
          content area, just below the tab strip. */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2">
        {unfilled.length > 0 && (
          <span
            className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning"
            title="Unfilled variables are copied as {{name}}"
          >
            {unfilled.length} unfilled
          </span>
        )}
        <Button
          size="sm"
          className="gap-1.5 min-w-[180px] justify-center"
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
      </div>

      {/* Helper text — sits directly beneath the copy bar when variables are
          unfilled. */}
      {unfilled.length > 0 && (
        <div className="border-b border-border px-3 py-1.5">
          <p className="text-caption text-muted-foreground">
            {unfilled.length === 1
              ? "1 variable is unfilled — its {{placeholder}} will be copied as-is."
              : `${unfilled.length} variables are unfilled — their {{placeholders}} will be copied as-is.`}
          </p>
        </div>
      )}

      {/* Compiled output — Markdown rendered to sanitized HTML, with unfilled
          {{placeholders}} highlighted as dashed .var-token--empty pills. Body
          text uses the app's UI font (not monospace); only code spans/blocks do.
          The raw compiled Markdown (not this HTML) is what Copy puts on the clipboard. */}
      <div className="flex-1 overflow-auto">
        <div
          aria-label="Compiled prompt preview"
          className="markdown-preview m-3 rounded-xl border border-code-border bg-code-bg px-4 py-3"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
