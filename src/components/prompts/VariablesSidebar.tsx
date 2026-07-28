import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { PanelStatusBar } from "@/components/prompts/PanelStatusBar";

interface VariablesSidebarProps {
  content: string;
  onInsertVariable: (variable: string) => void;
  /** The prompt being edited, or null when creating a new prompt (no values to persist yet). */
  promptId: number | null;
  /** Saved variable values for this prompt, keyed by variable name. */
  variableValues: Record<string, string>;
  /** Persist a single variable's value (called on debounced typing + blur). */
  onSaveVariable: (name: string, value: string) => void;
  /** Which variable row is currently expanded (accordion). Parent owns this so
      it resets when toggling panels. */
  expandedName: string | null;
  onToggleExpand: (name: string) => void;
}

/** A variable detected in the prompt content (read-only, derived). */
interface DetectedVariable {
  name: string;
  count: number;
}

/** A variable the user added manually, with optional metadata. */
interface CustomVariable {
  id: string;
  name: string;
  default: string;
  description: string;
}

export function VariablesSidebar({
  content,
  onInsertVariable,
  promptId,
  variableValues,
  onSaveVariable,
  expandedName,
  onToggleExpand,
}: VariablesSidebarProps) {
  const [customVariables, setCustomVariables] = useState<CustomVariable[]>([]);
  const [newName, setNewName] = useState("");
  const [newDefault, setNewDefault] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [showAddFields, setShowAddFields] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDefault, setEditDefault] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Local draft values for the open textarea(s). These mirror what the user is
  // typing and are the source of truth for the textarea; the debounce/blur in
  // the parent persists them up into variableValues. We sync from the saved
  // values when a row expands so external changes (e.g. reload) are reflected.
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Extract variables from content using regex pattern {{variableName}}
  const extractedVariables = useMemo(() => {
    const regex = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
    const matches: Record<string, number> = {};
    let match;
    while ((match = regex.exec(content)) !== null) {
      const varName = match[1];
      matches[varName] = (matches[varName] || 0) + 1;
    }
    return Object.entries(matches)
      .map(([name, count]): DetectedVariable => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [content]);

  const allVariables = useMemo(() => {
    const custom = customVariables.map((v) => v.name);
    const combined = [...new Set([...extractedVariables.map((v) => v.name), ...custom])];
    return combined.sort();
  }, [extractedVariables, customVariables]);

  const handleAddVariable = () => {
    const trimmed = newName.trim().replace(/[^a-zA-Z0-9_]/g, "_");
    if (trimmed && !customVariables.some((v) => v.name === trimmed)) {
      setCustomVariables([
        ...customVariables,
        {
          id: `${trimmed}-${Date.now()}`,
          name: trimmed,
          default: newDefault.trim(),
          description: newDescription.trim(),
        },
      ]);
      setNewName("");
      setNewDefault("");
      setNewDescription("");
      setShowAddFields(false);
    }
  };

  const handleRemoveCustomVariable = (id: string) => {
    setCustomVariables(customVariables.filter((v) => v.id !== id));
  };

  const handleUpdateCustomVariable = (id: string) => {
    setCustomVariables(
      customVariables.map((v) =>
        v.id === id
          ? { ...v, default: editDefault.trim(), description: editDescription.trim() }
          : v
      )
    );
    setEditingId(null);
  };

  const handleInsert = (name: string) => {
    onInsertVariable(`{{${name}}}`);
  };

  const startEditing = (v: CustomVariable) => {
    setEditingId(v.id);
    setEditDefault(v.default);
    setEditDescription(v.description);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditDefault("");
    setEditDescription("");
  };

  const resetAddForm = () => {
    setShowAddFields(false);
    setNewName("");
    setNewDefault("");
    setNewDescription("");
  };

  const canAdd = newName.trim().length > 0;

  const isExtracted = (name: string) => extractedVariables.some((v) => v.name === name);
  const getUsageCount = (name: string) => extractedVariables.find((v) => v.name === name)?.count || 0;

  // --- Variable value editing (accordion + debounced autosave) ----------------

  // When a row expands, seed its draft from the saved value (if any) so the
  // textarea shows what's persisted and edits start from there.
  useEffect(() => {
    if (expandedName) {
      setDraftValues((prev) => {
        if (prev[expandedName] !== undefined) return prev;
        return { ...prev, [expandedName]: variableValues[expandedName] ?? "" };
      });
    }
  }, [expandedName, variableValues]);

  const flushSave = useCallback(
    (name: string) => {
      const timer = debounceTimers.current[name];
      if (timer) {
        clearTimeout(timer);
        delete debounceTimers.current[name];
      }
      const value = draftValues[name] ?? variableValues[name] ?? "";
      onSaveVariable(name, value);
    },
    [draftValues, variableValues, onSaveVariable]
  );

  const handleDraftChange = useCallback(
    (name: string, value: string) => {
      setDraftValues((prev) => ({ ...prev, [name]: value }));
      // Debounced autosave (~400ms of inactivity).
      const existing = debounceTimers.current[name];
      if (existing) clearTimeout(existing);
      debounceTimers.current[name] = setTimeout(() => {
        onSaveVariable(name, value);
        delete debounceTimers.current[name];
      }, 400);
    },
    [onSaveVariable]
  );

  // Flush any pending debounced saves when the component unmounts (e.g. user
  // switches panels or navigates away) so the latest value is never lost.
  useEffect(() => {
    const timers = debounceTimers.current;
    return () => {
      for (const name of Object.keys(timers)) {
        clearTimeout(timers[name]);
        const value = draftValues[name] ?? variableValues[name] ?? "";
        onSaveVariable(name, value);
      }
    };
    // Intentionally run only on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRowActivate = (name: string) => {
    onToggleExpand(name);
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-card">
      {/* Status bar — mirrors the Preview/Edit top bar so panels sitting
          side-by-side read as one system. */}
      <PanelStatusBar>
        <span className="font-medium">Variables</span>
        <span aria-hidden className="h-3 w-px bg-border" />
        <span>
          {allVariables.length} variable{allVariables.length === 1 ? "" : "s"} detected
        </span>
      </PanelStatusBar>

      {/* Add custom variable */}
      <div className="border-b border-border p-3 space-y-2">
        {!showAddFields ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setShowAddFields(true);
                }
              }}
              placeholder="Add variable..."
              className="flex-1 rounded-sm border border-input bg-background px-3 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground shadow-macos-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setShowAddFields(true)}
              disabled={!canAdd}
              title="Add variable"
            >
              <Icon name="add" size="sm" />
            </Button>
          </div>
        ) : (
          <div className="space-y-2 rounded-lg border border-input bg-background p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">New variable</span>
              <button
                onClick={resetAddForm}
                className="text-muted-foreground hover:text-foreground"
                title="Cancel"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canAdd) handleAddVariable();
              }}
              placeholder="Variable name"
              className="w-full rounded-sm border border-input bg-background px-2 py-1 text-sm ring-offset-background placeholder:text-muted-foreground shadow-macos-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <input
              type="text"
              value={newDefault}
              onChange={(e) => setNewDefault(e.target.value)}
              placeholder="Default value (optional)"
              className="w-full rounded-sm border border-input bg-background px-2 py-1 text-sm ring-offset-background placeholder:text-muted-foreground shadow-macos-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canAdd) handleAddVariable();
              }}
              placeholder="Description (optional)"
              className="w-full rounded-sm border border-input bg-background px-2 py-1 text-sm ring-offset-background placeholder:text-muted-foreground shadow-macos-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <Button
              size="sm"
              className="w-full"
              onClick={handleAddVariable}
              disabled={!canAdd}
            >
              Add variable
            </Button>
          </div>
        )}
        <p className="text-caption text-muted-foreground">
          Use {"{{variable_name}}"} syntax in your prompt
        </p>
      </div>

      {/* Variable list */}
      <div className="flex-1 overflow-auto">
        {allVariables.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <Icon name="variable" size="xl" className="text-muted-foreground/40" />
            <p className="mt-2 text-caption text-muted-foreground">
              No variables found. Add custom ones or use {"{{variable}}"} syntax.
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {/* Extracted variables section */}
            {extractedVariables.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-eyebrow text-muted-foreground">
                  Detected
                </div>
                {extractedVariables.map((variable) => (
                  <DetectedVariableRow
                    key={variable.name}
                    variable={variable}
                    usageCount={variable.count}
                    savedValue={variableValues[variable.name]}
                    draftValue={draftValues[variable.name] ?? variableValues[variable.name] ?? ""}
                    expanded={expandedName === variable.name}
                    promptId={promptId}
                    onToggle={() => handleRowActivate(variable.name)}
                    onDraftChange={handleDraftChange}
                    onFlushSave={flushSave}
                    onInsert={handleInsert}
                  />
                ))}
              </>
            )}

            {/* Custom variables section */}
            {customVariables.filter((v) => !isExtracted(v.name)).length > 0 && (
              <>
                <div className="px-2 py-1.5 mt-2 text-eyebrow text-muted-foreground">
                  Custom
                </div>
                {customVariables
                  .filter((v) => !isExtracted(v.name))
                  .map((v) => (
                    <div key={v.id} className="rounded-sm px-2 py-1.5 transition-colors duration-150 hover:bg-muted/50">
                      {editingId === v.id ? (
                        <div className="space-y-2 pt-0.5">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                            <code className="text-xs font-code text-foreground truncate">
                              {v.name}
                            </code>
                          </div>
                          <input
                            type="text"
                            value={editDefault}
                            onChange={(e) => setEditDefault(e.target.value)}
                            placeholder="Default value (optional)"
                            className="w-full rounded-sm border border-input bg-background px-2 py-1 text-xs ring-offset-background placeholder:text-muted-foreground shadow-macos-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          />
                          <input
                            type="text"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleUpdateCustomVariable(v.id);
                            }}
                            placeholder="Description (optional)"
                            className="w-full rounded-sm border border-input bg-background px-2 py-1 text-xs ring-offset-background placeholder:text-muted-foreground shadow-macos-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          />
                          <div className="flex items-center gap-1.5">
                            <Button size="sm" className="h-6 px-2 text-xs" onClick={() => handleUpdateCustomVariable(v.id)}>
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={cancelEditing}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="group flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                              <code className="text-xs font-code text-foreground truncate">
                                {v.name}
                              </code>
                            </div>
                            {v.default && (
                              <p className="ml-4 mt-0.5 truncate text-caption text-muted-foreground">
                                default: {v.default}
                              </p>
                            )}
                            {v.description && (
                              <p className="ml-4 truncate text-caption text-muted-foreground">
                                {v.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleInsert(v.name)}
                              title="Insert variable"
                            >
                              <Icon name="add" size="xs" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                              onClick={() => startEditing(v)}
                              title="Edit variable"
                            >
                              <Icon name="edit" size="xs" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemoveCustomVariable(v.id)}
                              title="Remove variable"
                            >
                              <Icon name="close" size="xs" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Quick insert section */}
      {allVariables.length > 0 && (
        <div className="border-t border-border p-3">
          <p className="text-caption text-muted-foreground mb-2">Quick insert</p>
          <div className="flex flex-wrap gap-1.5">
            {allVariables.slice(0, 8).map((name) => (
              <button
                key={name}
                onClick={() => handleInsert(name)}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-code transition-colors duration-150",
                  isExtracted(name)
                    ? "bg-success/10 text-success hover:bg-success/20"
                    : "bg-primary/10 text-primary hover:bg-primary/20"
                )}
              >
                {`{{${name}}}`}
              </button>
            ))}
            {allVariables.length > 8 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                +{allVariables.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Detected variable row with inline accordion value editor ───────────────

interface DetectedVariableRowProps {
  variable: DetectedVariable;
  usageCount: number;
  savedValue: string | undefined;
  draftValue: string;
  expanded: boolean;
  promptId: number | null;
  onToggle: () => void;
  onDraftChange: (name: string, value: string) => void;
  onFlushSave: (name: string) => void;
  onInsert: (name: string) => void;
}

function DetectedVariableRow({
  variable,
  usageCount,
  savedValue,
  draftValue,
  expanded,
  promptId,
  onToggle,
  onDraftChange,
  onFlushSave,
  onInsert,
}: DetectedVariableRowProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasValue = savedValue && savedValue.trim().length > 0;

  // Autofocus the textarea when the row expands.
  useEffect(() => {
    if (expanded && textareaRef.current) {
      textareaRef.current.focus();
      // Place cursor at end
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [expanded]);

  return (
    <div className="rounded-sm">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={`${variable.name} variable, ${usageCount} occurrence${usageCount === 1 ? "" : "s"}`}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        className={cn(
          "group flex items-center justify-between rounded-sm px-2 py-1.5 transition-colors duration-150 cursor-pointer",
          expanded ? "bg-muted/60" : "hover:bg-muted/50"
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Chevron affordance — rotates when expanded. */}
          <Icon
            name="chevronRight"
            size="xs"
            className={cn(
              "shrink-0 text-muted-foreground transition-transform duration-200",
              expanded && "rotate-90"
            )}
          />
          <div
            className={cn(
              "h-2 w-2 rounded-full flex-shrink-0",
              hasValue ? "bg-green-500" : "bg-green-500/30"
            )}
            title={hasValue ? "Has a saved value" : "No value set"}
          />
          <code className="text-xs font-code text-foreground truncate">
            {variable.name}
          </code>
          {/* Filled-row preview: truncated value so the user sees which vars are
              populated without expanding every row. */}
          {hasValue && (
            <span className="truncate text-caption text-muted-foreground max-w-[120px]">
              · {savedValue.length > 24 ? `${savedValue.slice(0, 24)}…` : savedValue}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="rounded-full bg-success/10 px-1.5 py-0.5 text-xs font-medium text-success">
            {usageCount}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onInsert(variable.name);
            }}
            title="Insert variable"
          >
            <Icon name="add" size="xs" />
          </Button>
        </div>
      </div>

      {/* Inline expansion — resizable textarea for this variable's value. */}
      {expanded && (
        <div className="px-2 pb-2 pt-1">
          <textarea
            ref={textareaRef}
            value={draftValue}
            onChange={(e) => onDraftChange(variable.name, e.target.value)}
            onBlur={() => onFlushSave(variable.name)}
            placeholder={`Enter a value for {{${variable.name}}}…`}
            rows={3}
            className={cn(
              "w-full resize-y rounded-sm border border-input bg-background px-2 py-1.5 text-xs shadow-macos-inset",
              "ring-offset-background placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              promptId === null && "opacity-60"
            )}
            disabled={promptId === null}
          />
          <p className={cn("mt-1 text-caption", promptId === null ? "text-warning" : "text-muted-foreground")}>
            {promptId === null
              ? "Save the prompt first to store variable values."
              : "Autosaves as you type · drag the corner to resize"}
          </p>
        </div>
      )}
    </div>
  );
}
