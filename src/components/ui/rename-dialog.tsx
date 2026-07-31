import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RenameDialogProps {
  open: boolean;
  /** Current name, prefilled into the input. */
  currentName: string;
  /** e.g. "Category" or "Tag" — used in the title and label. */
  entityLabel: string;
  /** Existing names (excluding currentName) used to block duplicates. */
  existingNames?: string[];
  onClose: () => void;
  onSubmit: (newName: string) => void;
}

export function RenameDialog({
  open,
  currentName,
  entityLabel,
  existingNames = [],
  onClose,
  onSubmit,
}: RenameDialogProps) {
  const [value, setValue] = useState(currentName);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // reset the field whenever the dialog is (re)opened for a different entity
  useEffect(() => {
    if (open) {
      setValue(currentName);
      setIsSubmitting(false);
    }
  }, [open, currentName]);

  const trimmed = value.trim();
  const isDuplicate =
    trimmed.toLowerCase() !== currentName.toLowerCase() &&
    existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase());
  const canSubmit = !!trimmed && trimmed !== currentName && !isDuplicate && !isSubmitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    onSubmit(trimmed);
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Rename ${entityLabel}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting ? "Renaming..." : "Rename"}
          </Button>
        </>
      }
    >
      <div className="space-y-2">
        <Label htmlFor="rename-input">{entityLabel} Name</Label>
        <Input
          id="rename-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          autoFocus
        />
        {isDuplicate && (
          <p className="text-sm text-warning">
            A {entityLabel.toLowerCase()} with this name already exists.
          </p>
        )}
      </div>
    </Modal>
  );
}
