import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { PanelStatusBar } from "@/components/prompts/PanelStatusBar";
import type { VariableSet } from "@/types";

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
  /** The prompt's named variable sets; the active one is read/written. */
  variableSets: VariableSet[];
  /** Currently active set id, or null when the prompt has no sets yet. */
  activeSetId: number | null;
  /** Switch which set the editor reads/writes (parent reloads values). */
  onSelectSet: (setId: number) => void;
  /** Create a new named set (stays inactive unless it's the first). */
  onCreateSet: (name: string) => void;
  /** Delete a set and its saved values. */
  onDeleteSet: (setId: number) => void;
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
  variableSets,
  activeSetId,
  onSelectSet,
  onCreateSet,
  onDeleteSet,
}: VariablesSidebarProps) {
  const [customVariables, setCustomVariables] = useState<CustomVariable[]>([]);
  const [newName, setNewName] = useState("");
  const [newDefault, setNewDefault] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [showAddFields, setShowAddFields] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDefault, setEditDefault] = useState("");
  const [editDescription, setEditDescription] = useState("");
  // Variable-set creation (inline name form shown by the dropdown's + button).
  const [showCreateSet, setShowCreateSet] = useState(false);
  const [newSetName, setNewSetName] = useState("");
  // Delete-set confirmation.
  const [deleteSetOpen, setDeleteSetOpen] = useState(false);

  // Local draft values for the open textarea(s). These mirror what the user is
  // typing and are the source of truth for the textarea; the debounce/blur in
  // the parent persists them up into variableValues. We sync from the saved
  // values when a row expands so external changes (e.g. reload) are reflected.
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Latest-value mirrors for the unmount flush below. The flush effect runs
  // only once with mount-time closures; the refs keep it reading the freshest
  // drafts (a set switch remounts this component, so stale drafts would
  // otherwise overwrite the set the user just typed into).
  const draftValuesRef = useRef(draftValues);
  draftValuesRef.current = draftValues;
  const variableValuesRef = useRef(variableValues);
  variableValuesRef.current = variableValues;

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
  // switches panels, navigates away, or switches variable sets) so the latest
  // value is never lost. Reads drafts via the refs to avoid mount-time stale
  // closures (see above).
  useEffect(() => {
    const timers = debounceTimers.current;
    return () => {
      for (const name of Object.keys(timers)) {
        clearTimeout(timers[name]);
        const value = draftValuesRef.current[name] ?? variableValuesRef.current[name] ?? "";
        onSaveVariable(name, value);
      }
    };
    // Intentionally run only on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRowActivate = (name: string) => {
    onToggleExpand(name);
  };

  // --- Variable set switching / management ----------------------------------

  const activeSet = variableSets.find((s) => s.id === activeSetId) ?? null;

  const confirmCreateSet = () => {
    const trimmed = newSetName.trim();
    if (!trimmed) return;
    onCreateSet(trimmed);
    setNewSetName("");
    setShowCreateSet(false);
  };

  const handleDeleteSet = () => {
    if (activeSetId === null) return;
    onDeleteSet(activeSetId);
    setDeleteSetOpen(false);
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-card">
      {/* Status bar — mirrors the Preview/Edit top bar so panels sitting
          side-by-side read as one system. */}
      <PanelStatusBar>
        <span className="font-medium">Variables</span>
        <Separator orientation="vertical" className="h-3" />
        <span>
          {allVariables.length} variable{allVariables.length === 1 ? "" : "s"} detected
        </span>
      </PanelStatusBar>

      {/* Add custom variable */}
      <div className="space-y-2 border-b border-border p-3">
        {!showAddFields ? (
          <div className="flex gap-2">
            <Input
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
              aria-label="New variable name"
              className="h-8 flex-1 text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 shrink-0 p-0"
              onClick={() => setShowAddFields(true)}
              disabled={!canAdd}
              aria-label="Add variable"
              title="Add variable"
            >
              <Icon name="add" size="sm" />
            </Button>
          </div>
        ) : (
          <div className="space-y-2 rounded-lg border border-input bg-background p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">New variable</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={resetAddForm}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                aria-label="Cancel"
                title="Cancel"
              >
                <Icon name="close" size="sm" />
              </Button>
            </div>
            <Input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canAdd) handleAddVariable();
              }}
              placeholder="Variable name"
              aria-label="Variable name"
              className="h-8 text-sm"
            />
            <Input
              type="text"
              value={newDefault}
              onChange={(e) => setNewDefault(e.target.value)}
              placeholder="Default value (optional)"
              aria-label="Default value (optional)"
              className="h-8 text-sm"
            />
            <Input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canAdd) handleAddVariable();
              }}
              placeholder="Description (optional)"
              aria-label="Description (optional)"
              className="h-8 text-sm"
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
        <p className="text-xs text-muted-foreground">
          Use {"{{variable_name}}"} syntax in your prompt
        </p>
      </div>

      {/* Variable sets — one prompt can hold many named value sets; the dropdown
          switches the active set, and the + / × buttons create / delete one. */}
      <div className="space-y-2 border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <Select
              value={activeSetId !== null ? String(activeSetId) : ""}
              onValueChange={(v) => {
                const num = Number(v);
                if (num) onSelectSet(num);
              }}
              disabled={promptId === null || variableSets.length === 0}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="No sets" />
              </SelectTrigger>
              <SelectContent>
                {variableSets.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                    {s.isActive ? " · active" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 w-7 shrink-0 p-0"
            onClick={() => setShowCreateSet((v) => !v)}
            disabled={promptId === null}
            aria-label="Create variable set"
            title="Create variable set"
          >
            <Icon name="add" size="sm" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 w-7 shrink-0 p-0 text-muted-foreground hover:text-destructive"
            onClick={() => setDeleteSetOpen(true)}
            disabled={promptId === null || activeSetId === null}
            aria-label="Delete active variable set"
            title="Delete active variable set"
          >
            <Icon name="close" size="sm" />
          </Button>
        </div>

        {showCreateSet && (
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={newSetName}
              onChange={(e) => setNewSetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  confirmCreateSet();
                }
                if (e.key === "Escape") {
                  setShowCreateSet(false);
                  setNewSetName("");
                }
              }}
              autoFocus
              placeholder="Set name, e.g. Client A…"
              aria-label="Variable set name"
              className="h-7 min-w-0 flex-1 text-xs"
            />
            <Button
              size="sm"
              className="h-7 shrink-0 px-2 text-xs"
              onClick={confirmCreateSet}
              disabled={!newSetName.trim()}
            >
              Create
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 shrink-0 p-0"
              onClick={() => {
                setShowCreateSet(false);
                setNewSetName("");
              }}
              aria-label="Cancel"
              title="Cancel"
            >
              <Icon name="close" size="sm" />
            </Button>
          </div>
        )}

        {promptId === null && (
          <p className="text-xs text-warning">
            Save the prompt first to create variable sets.
          </p>
        )}
      </div>

      {/* Variable list */}
      <ScrollArea className="min-h-0 flex-1">
        {allVariables.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
            <Icon name="variable" size="xl" className="text-muted-foreground/40" />
            <p className="mt-2 text-xs text-muted-foreground">
              No variables found. Add custom ones or use {"{{variable}}"} syntax.
            </p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {/* Extracted variables section */}
            {extractedVariables.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
                <div className="mt-2 px-2 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Custom
                </div>
                {customVariables
                  .filter((v) => !isExtracted(v.name))
                  .map((v) => (
                    <div key={v.id} className="rounded-sm px-2 py-1.5 transition-colors duration-150 hover:bg-muted/50">
                      {editingId === v.id ? (
                        <div className="space-y-2 pt-0.5">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                            <code className="truncate font-mono text-xs text-foreground">
                              {v.name}
                            </code>
                          </div>
                          <Input
                            type="text"
                            value={editDefault}
                            onChange={(e) => setEditDefault(e.target.value)}
                            placeholder="Default value (optional)"
                            aria-label="Default value (optional)"
                            className="h-7 text-xs"
                          />
                          <Input
                            type="text"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleUpdateCustomVariable(v.id);
                            }}
                            placeholder="Description (optional)"
                            aria-label="Description (optional)"
                            className="h-7 text-xs"
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
                              <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                              <code className="truncate font-mono text-xs text-foreground">
                                {v.name}
                              </code>
                            </div>
                            {v.default && (
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                default: {v.default}
                              </p>
                            )}
                            {v.description && (
                              <p className="truncate text-xs text-muted-foreground">
                                {v.description}
                              </p>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                              onClick={() => handleInsert(v.name)}
                              aria-label="Insert variable"
                              title="Insert variable"
                            >
                              <Icon name="add" size="xs" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                              onClick={() => startEditing(v)}
                              aria-label="Edit variable"
                              title="Edit variable"
                            >
                              <Icon name="edit" size="xs" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                              onClick={() => handleRemoveCustomVariable(v.id)}
                              aria-label="Remove variable"
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
      </ScrollArea>

      {/* Quick insert section */}
      {allVariables.length > 0 && (
        <div className="border-t border-border p-3">
          <p className="mb-2 text-xs text-muted-foreground">Quick insert</p>
          <div className="flex flex-wrap gap-1.5">
            {allVariables.slice(0, 8).map((name) => (
              <Button
                key={name}
                size="sm"
                variant="ghost"
                onClick={() => handleInsert(name)}
                className={cn(
                  "h-6 rounded-full px-2.5 py-0 font-mono text-xs",
                  isExtracted(name)
                    ? "bg-success/10 text-success hover:bg-success/20 hover:text-success"
                    : "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                )}
              >
                {`{{${name}}}`}
              </Button>
            ))}
            {allVariables.length > 8 && (
              <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs font-normal">
                +{allVariables.length - 8} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Delete-set confirmation */}
      <AlertDialog open={deleteSetOpen} onOpenChange={setDeleteSetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete variable set</AlertDialogTitle>
            <AlertDialogDescription>
              {activeSet
                ? `Delete variable set "${activeSet.name}"? Its saved values for this prompt will be removed.`
                : "Delete this variable set? Its saved values for this prompt will be removed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteSet}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          aria-label={`${variable.name} variable, ${usageCount} occurrence${usageCount === 1 ? "" : "s"}`}
          className={cn(
            "group flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left transition-colors duration-150",
            "cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            expanded ? "bg-muted/60" : "hover:bg-muted/50"
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
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
                "h-2 w-2 shrink-0 rounded-full",
                hasValue ? "bg-success" : "bg-success/30"
              )}
              title={hasValue ? "Has a saved value" : "No value set"}
            />
            <code className="truncate font-mono text-xs text-foreground">
              {variable.name}
            </code>
            {/* Filled-row preview: truncated value so the user sees which vars are
                populated without expanding every row. */}
            {hasValue && (
              <span className="max-w-[120px] truncate text-xs text-muted-foreground">
                · {savedValue.length > 24 ? `${savedValue.slice(0, 24)}…` : savedValue}
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Badge className="rounded-full bg-success/10 px-1.5 py-0 text-xs font-medium text-success hover:bg-success/10">
              {usageCount}
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onInsert(variable.name);
              }}
              aria-label="Insert variable"
              title="Insert variable"
            >
              <Icon name="add" size="xs" />
            </Button>
          </div>
        </button>
      </CollapsibleTrigger>

      {/* Inline expansion — resizable textarea for this variable's value. */}
      <CollapsibleContent>
        <div className="px-2 pb-2 pt-1">
          <Textarea
            ref={textareaRef}
            value={draftValue}
            onChange={(e) => onDraftChange(variable.name, e.target.value)}
            onBlur={() => onFlushSave(variable.name)}
            placeholder={`Enter a value for {{${variable.name}}}…`}
            aria-label={`Value for {{${variable.name}}}`}
            rows={3}
            className={cn(
              "min-h-[60px] resize-y text-xs",
              promptId === null && "opacity-60"
            )}
            disabled={promptId === null}
          />
          <p className={cn("mt-1 text-xs", promptId === null ? "text-warning" : "text-muted-foreground")}>
            {promptId === null
              ? "Save the prompt first to store variable values."
              : "Autosaves as you type · drag the corner to resize"}
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
