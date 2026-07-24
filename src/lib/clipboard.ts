/**
 * Single source of truth for copying text to the clipboard.
 *
 * Strategy, in order:
 *   1. Tauri clipboard-manager plugin — works in the Tauri webview regardless of
 *      secure-context restrictions that gate navigator.clipboard. Dynamic import
 *      so the bundler never pulls it into a non-Tauri (browser-only) build.
 *   2. navigator.clipboard.writeText — the Web Clipboard API. Available in secure
 *      contexts (https, localhost) in plain browsers.
 *   3. execCommand("copy") over a detached, off-screen textarea — last-resort hack
 *      for non-secure contexts where the above two are unavailable.
 *
 * Returns true if the write succeeded, false otherwise. Never throws — callers
 * can inspect the boolean to show a failure toast.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // 1. Tauri plugin (primary in the desktop webview).
  try {
    const mod = await import("@tauri-apps/plugin-clipboard-manager");
    const writeText = mod.writeText;
    if (typeof writeText !== "function") {
      console.warn("Tauri clipboard plugin loaded but writeText is not a function:", mod);
      throw new Error("writeText missing from clipboard-manager module");
    }
    await writeText(text);
    return true;
  } catch (pluginErr) {
    // Plugin unavailable (not a Tauri runtime, IPC bridge missing, or permission
    // denied — the latter throws from the invoke() call inside writeText). Log the
    // full error so a rejected IPC (e.g. missing clipboard-manager:allow-write-text
    // capability) is diagnosable from the webview console.
    console.warn("[clipboard] Tauri plugin path failed:", pluginErr);
    if (pluginErr instanceof Error) {
      console.warn("  name:", pluginErr.name, "| message:", pluginErr.message);
      if (pluginErr.stack) console.warn("  stack:", pluginErr.stack.split("\n").slice(0, 4).join("\n"));
    }
  }

  // 2. Web Clipboard API.
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (clipErr) {
    console.warn("navigator.clipboard.writeText failed:", clipErr);
  }

  // 3. execCommand fallback — detached textarea, selected, copied, removed.
  //    Works without a secure context as long as the document is laid out (the
  //    textarea must be in the DOM for select() to register a real selection).
  try {
    const textarea = document.createElement("textarea");
    textarea.value = textarea.textContent = text;
    textarea.style.cssText =
      "position:fixed;left:-9999px;top:0;opacity:0;pointer-events:none;";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    // Some platforms require the element be visible-ish for select() to stick;
    // the above keeps it off-screen but laid out.
    const succeeded = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (succeeded) return true;
    console.warn("execCommand('copy') returned false");
  } catch (execErr) {
    console.error("Clipboard execCommand fallback failed:", execErr);
  }

  return false;
}
