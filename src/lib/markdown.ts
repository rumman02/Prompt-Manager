import { marked } from "marked";
import DOMPurify from "dompurify";
import { compilePrompt, hashHue, VARIABLE_TOKEN_RE, type CompileResult } from "@/lib/utils";

// marked is configured for synchronous, GFM-aware compilation. No extensions are
// async, so `parse(src, { async: false })` returns a plain string (not a Promise).
marked.setOptions({ gfm: true, breaks: false });

// Matches {{variable_name}} placeholders that survived compilation (i.e. unfilled ones).
// Same regex as the editor overlay / compiler so the three never drift apart.
const TOKEN_RE = VARIABLE_TOKEN_RE;

// Wrap an unfilled {{name}} token in the same pill the editor + preview already use.
// The class carries the dashed, lower-opacity styling that reads as "still needs a value".
function wrapToken(name: string): string {
  return `<span class="var-token--empty" title="No value set — this placeholder was copied as-is">{{${name}}}</span>`;
}

// Replace {{name}} tokens in a PLAIN-TEXT segment (never inside an HTML tag or attribute).
function highlightTokens(text: string): string {
  return text.replace(TOKEN_RE, (_match, name: string) => wrapToken(name));
}

/**
 * Render a compiled, sanitized HTML string with unfilled-variable highlighting —
 * without ever corrupting HTML tags/attributes or touching tokens inside <code>/<pre>.
 *
 * The trick: split the HTML on tag boundaries, run the {{name}} replacement only on
 * the non-tag (text) segments, then rejoin. Tags pass through untouched (so attributes
 * containing literal braces, or code blocks that deliberately show {{...}}, stay intact),
 * and only real placeholder tokens in prose get wrapped.
 */
function postProcessVariables(html: string): string {
  const segments = html.split(/(<[^>]*>)/);
  return segments
    .map((seg) => (seg.startsWith("<") ? seg : highlightTokens(seg)))
    .join("");
}

// Sentinels used to mark substituted variable values through the Markdown and
// sanitize passes. Private-use codepoints: marked leaves them alone and
// DOMPurify treats them as ordinary text, so they survive intact and can be
// swapped for real markup afterwards.
const VAL_START = "";
const VAL_END = "";
const VAL_MID = "";

/**
 * Second compile pass whose only job is to mark where variable values landed.
 * Values containing a newline are left unmarked: a multi-line value can be
 * split across separate block elements by marked, which would leave the
 * sentinels in different parents and produce mis-nested spans.
 */
function compileWithValueMarkers(
  content: string,
  variableValues: Record<string, string>,
): string {
  return content.replace(VARIABLE_TOKEN_RE, (match, name: string) => {
    const value = variableValues[name];
    if (value === undefined || value.trim().length === 0) return match;
    if (value.includes("\n")) return value;
    return `${VAL_START}${hashHue(name)}${VAL_MID}${value}${VAL_END}`;
  });
}

// Swap surviving sentinels for the real pill markup. Runs after DOMPurify, so
// the span and its style attribute are ours and cannot be user-injected.
function replaceValueMarkers(html: string): string {
  const re = new RegExp(`${VAL_START}(\\d+)${VAL_MID}([\\s\\S]*?)${VAL_END}`, "g");
  return html.replace(
    re,
    (_m, hue: string, inner: string) =>
      `<span class="var-value" style="--token-hue:${hue}deg">${inner}</span>`,
  );
}

// Safety net: strip any sentinel that did not get paired up, so raw
// private-use characters can never leak into rendered output.
function stripValueMarkers(text: string): string {
  return text.split(VAL_START).join("").split(VAL_END).join("").split(VAL_MID).join("");
}

// Add rel="noopener noreferrer" to any anchor that opens in a new tab, so target="_blank"
// links don't get to reach back at the page. DOMPurify strips event handlers; this closes
// the remaining reverse-tabnab vector on the sanitized output.
function addRelToExternalLinks(html: string): string {
  return html.replace(
    /<a\s([^>]*?)target="_blank"([^>]*)>/g,
    (_match, before, after) => {
      // Skip if a rel is already present (avoid duplicates).
      if (/\brel=/.test(before) || /\brel=/.test(after)) return _match;
      return `<a ${before}target="_blank" rel="noopener noreferrer"${after}>`;
    },
  );
}

export interface RenderedMarkdown {
  /** Raw compiled Markdown text (variables substituted, unfilled left as {{name}}). For clipboard/copy. */
  text: string;
  /** Sanitized, variable-highlighted HTML for rendering. */
  html: string;
  /** Names with no saved value yet, in order of first appearance. */
  unfilled: string[];
}

/**
 * The single source of truth for turning prompt content into a safe, renderable preview.
 *
 * Pipeline: compile (substitute vars) → marked (Markdown→HTML) → DOMPurify (strip XSS) →
 * post-process (wrap unfilled {{name}} in .var-token--empty spans, never inside tags/code).
 *
 * DOMPurify needs a DOM. In the Tauri webview this is always present; the guard keeps the
 * module import-safe in any non-DOM context (tests, SSR).
 */
export function renderCompiledMarkdown(
  content: string,
  variableValues: Record<string, string>,
): RenderedMarkdown {
  const compiled: CompileResult = compilePrompt(content, variableValues);
  // Separate marked-up pass for rendering only; compiled.text stays clean
  // because it is what the Copy button writes to the clipboard.
  const markedSource = compileWithValueMarkers(content, variableValues);

  // Compile Markdown → HTML. Guard the DOM-dependent steps so a missing `window` degrades
  // to returning the raw compiled text rather than throwing.
  let html = stripValueMarkers(markedSource);
  if (typeof window !== "undefined" && window?.document) {
    const rawHtml = marked.parse(markedSource, { async: false }) as string;
    html = DOMPurify.sanitize(rawHtml, {
      USE_PROFILES: { html: true },
      ADD_ATTR: ["target", "rel"],
    });
    html = addRelToExternalLinks(html);
    html = postProcessVariables(html);
    html = replaceValueMarkers(html);
    html = stripValueMarkers(html);
  }

  return { text: compiled.text, html, unfilled: compiled.unfilled };
}
