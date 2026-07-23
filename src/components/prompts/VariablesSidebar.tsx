import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ResizeHandle } from "@/components/ui/resize-handle/resize-handle";
import { useResizable } from "@/hooks/useResizable";

interface VariablesSidebarProps {
  content: string;
  onInsertVariable: (variable: string) => void;
  /** When collapsed, the panel shrinks to a slim icon-only bar (like the main sidebar). */
  collapsed: boolean;
  onToggle: () => void;
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

export function VariablesSidebar({ content, onInsertVariable, collapsed, onToggle }: VariablesSidebarProps) {
  const [customVariables, setCustomVariables] = useState<CustomVariable[]>([]);
  const [newName, setNewName] = useState("");
  const [newDefault, setNewDefault] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [showAddFields, setShowAddFields] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDefault, setEditDefault] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const { width, onResizeStart, isResizing } = useResizable({
    initial: 256,
    min: 200,
    max: 480,
    side: "right",
  });

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

  // Collapsed state: a slim icon-only bar mirroring the main sidebar's
  // collapsed mode. Clicking re-expands; the count badge stays visible.
  if (collapsed) {
    return (
      <div className="flex h-full w-14 shrink-0 flex-col items-center border-l bg-card py-3">
        <button
          onClick={onToggle}
          title="Expand variables"
          className="flex h-10 w-10 flex-col items-center justify-center gap-0.5 rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.745 2.25h1.01m2.245 0h1.01m2.245 0h1.01m2.245 0h1.01m2.245 0h1.01M4.745 21.75h1.01m2.245 0h1.01m2.245 0h1.01m2.245 0h1.01m2.245 0h1.01M2.25 4.745v1.01m0 2.245v1.01m0 2.245v1.01m0 2.245v1.01m0 2.245v1.01m0 2.245v1.01M21.75 4.745v1.01m0 2.245v1.01m0 2.245v1.01m0 2.245v1.01m0 2.245v1.01m0 2.245v1.01" />
          </svg>
          <span className="text-[10px] font-medium leading-none">{allVariables.length}</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn("flex h-full shrink-0 flex-col border-l bg-card", isResizing && "select-none")}
      style={{ width }}
    >
      {/* Drag handle on the inner (left) edge — only while expanded. */}
      <ResizeHandle side="right" onMouseDown={onResizeStart} isActive={isResizing} />
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.745 2.25h1.01m2.245 0h1.01m2.245 0h1.01m2.245 0h1.01m2.245 0h1.01M4.745 21.75h1.01m2.245 0h1.01m2.245 0h1.01m2.245 0h1.01m2.245 0h1.01M2.25 4.745v1.01m0 2.245v1.01m0 2.245v1.01m0 2.245v1.01m0 2.245v1.01m0 2.245v1.01M21.75 4.745v1.01m0 2.245v1.01m0 2.245v1.01m0 2.245v1.01m0 2.245v1.01m0 2.245v1.01" />
          </svg>
          <span className="text-sm font-semibold">Variables</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            {allVariables.length}
          </span>
          <button
            onClick={onToggle}
            title="Collapse variables"
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Add custom variable */}
      <div className="border-b p-3 space-y-2">
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
              className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setShowAddFields(true)}
              disabled={!canAdd}
              title="Add variable"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </Button>
          </div>
        ) : (
          <div className="space-y-2 rounded-md border border-input bg-background p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">New variable</span>
              <button
                onClick={resetAddForm}
                className="text-muted-foreground hover:text-foreground"
                title="Cancel"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
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
              className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <input
              type="text"
              value={newDefault}
              onChange={(e) => setNewDefault(e.target.value)}
              placeholder="Default value (optional)"
              className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canAdd) handleAddVariable();
              }}
              placeholder="Description (optional)"
              className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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

      {/* Variable list */}
      <div className="flex-1 overflow-auto">
        {allVariables.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <svg className="h-10 w-10 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
            </svg>
            <p className="mt-2 text-xs text-muted-foreground">
              No variables found. Add custom ones or use {"{{variable}}"} syntax.
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {/* Extracted variables section */}
            {extractedVariables.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Detected
                </div>
                {extractedVariables.map((variable) => (
                  <div
                    key={variable.name}
                    className="group flex items-center justify-between rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                      <code className="text-xs font-mono text-foreground truncate">
                        {variable.name}
                      </code>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-xs font-medium text-green-600">
                        {variable.count}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleInsert(variable.name)}
                        title="Insert variable"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Custom variables section */}
            {customVariables.filter((v) => !isExtracted(v.name)).length > 0 && (
              <>
                <div className="px-2 py-1.5 mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Custom
                </div>
                {customVariables
                  .filter((v) => !isExtracted(v.name))
                  .map((v) => (
                    <div key={v.id} className="rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50">
                      {editingId === v.id ? (
                        <div className="space-y-2 pt-0.5">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                            <code className="text-xs font-mono text-foreground truncate">
                              {v.name}
                            </code>
                          </div>
                          <input
                            type="text"
                            value={editDefault}
                            onChange={(e) => setEditDefault(e.target.value)}
                            placeholder="Default value (optional)"
                            className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          />
                          <input
                            type="text"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleUpdateCustomVariable(v.id);
                            }}
                            placeholder="Description (optional)"
                            className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                              <code className="text-xs font-mono text-foreground truncate">
                                {v.name}
                              </code>
                            </div>
                            {v.default && (
                              <p className="ml-4 mt-0.5 truncate text-[11px] text-muted-foreground">
                                default: {v.default}
                              </p>
                            )}
                            {v.description && (
                              <p className="ml-4 truncate text-[11px] text-muted-foreground">
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
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                              </svg>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                              onClick={() => startEditing(v)}
                              title="Edit variable"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                              </svg>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemoveCustomVariable(v.id)}
                              title="Remove variable"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
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
        <div className="border-t p-3">
          <p className="text-xs text-muted-foreground mb-2">Quick insert</p>
          <div className="flex flex-wrap gap-1">
            {allVariables.slice(0, 8).map((name) => (
              <button
                key={name}
                onClick={() => handleInsert(name)}
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-mono transition-colors",
                  isExtracted(name)
                    ? "bg-green-500/10 text-green-700 hover:bg-green-500/20"
                    : "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20"
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
