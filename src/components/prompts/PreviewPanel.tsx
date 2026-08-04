import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  // "preview" = rendered Markdown preview, "raw" = raw compiled Markdown source.
  // Persists across re-renders so the user's choice sticks while editing.
  const [view, setView] = useState<"preview" | "raw">("preview");

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
          <Badge variant="secondary" className="rounded-full px-1.5 py-0">
            {unfilled.length}
          </Badge>
          <p className="truncate">
            {unfilled.length === 1
              ? "variable is unfilled — its {{placeholder}} will be copied as-is."
              : `variables are unfilled — their {{placeholders}} will be copied as-is.`}
          </p>
        </PanelStatusBar>
      )}

      <Tabs
        value={view}
        onValueChange={(v) => setView(v === "raw" ? "raw" : "preview")}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex shrink-0 items-center justify-between px-3 py-1.5">
          <TabsList className="h-8">
            <TabsTrigger value="preview" className="h-7 px-3 text-xs">
              Preview
            </TabsTrigger>
            <TabsTrigger value="raw" className="h-7 px-3 text-xs">
              Raw
            </TabsTrigger>
          </TabsList>
          <Button
            size="sm"
            variant="secondary"
            className="gap-1.5"
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

        <TabsContent
          value="preview"
          className="min-h-0 flex-1 overflow-hidden p-0 data-[state=active]:flex"
        >
          <ScrollArea className="h-full">
            <div
              aria-label="Compiled prompt preview"
              className="markdown-preview m-3 rounded-xl bg-muted/40 px-4 py-3 shadow-sm"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </ScrollArea>
        </TabsContent>

        <TabsContent
          value="raw"
          className="min-h-0 flex-1 overflow-hidden p-0 data-[state=active]:flex"
        >
          <ScrollArea className="h-full">
            <pre
              aria-label="Raw compiled Markdown"
              className="m-3 whitespace-pre-wrap rounded-xl bg-muted/40 px-4 py-3 font-mono text-sm leading-relaxed text-foreground shadow-sm"
            >
              {text}
            </pre>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
