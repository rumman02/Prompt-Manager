import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { Toaster } from "@/components/ui/sonner";
import "./index.css";

/* Suppress the native webview context menu ("Reload" / "Inspect Element")
 * in production builds only. Dev mode keeps its tools for debugging.
 *
 * Scope: never block right-click inside text-editable fields, so native
 * copy / paste / select-all stays available to the user. The custom
 * PromptActionsMenu already calls preventDefault() on its own right-clicks,
 * so this global listener does not interfere with it. */
if (!import.meta.env.DEV) {
  document.addEventListener(
    "contextmenu",
    (e) => {
      const target = e.target as HTMLElement | null;
      const editable = target?.closest(
        "input, textarea, [contenteditable='true']",
      );
      if (!editable) e.preventDefault();
    },
    { capture: true },
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Toaster
      position="bottom-right"
      richColors
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
        style: {
          borderRadius: "14px",
          backdropFilter: "blur(20px)",
          background: "hsl(var(--popover) / 0.9)",
          border: "1px solid var(--border)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.16)",
          fontFamily: "var(--font-ui)",
        },
      }}
    />
    <App />
  </React.StrictMode>
);
