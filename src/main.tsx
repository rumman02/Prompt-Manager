import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
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
    <App />
  </React.StrictMode>
);
