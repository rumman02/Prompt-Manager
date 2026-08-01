/**
 * EntityEditDialog — shared edit dialog for named resources (categories, tags).
 *
 * Built on Modal. Lets the user edit a resource's icon (via the existing
 * IconPicker), color (one of the RESOURCE_COLOR_KEYS swatches), and name in a
 * single dialog. Local state is reset from props whenever the dialog (re)opens.
 *
 * Save semantics: enabled whenever the trimmed name is non-empty and not a
 * duplicate — a name change is NOT required, so icon-only or color-only edits
 * are saveable. Duplicate detection is case-insensitive against existingNames
 * and ignores currentName. While the returned onSubmit promise is pending the
 * button shows "Saving..." and is disabled.
 */

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon, type IconName } from "@/components/ui/icon";
import { IconPicker } from "@/components/ui/icon-picker";
import {
  RESOURCE_COLORS,
  RESOURCE_COLOR_KEYS,
  DEFAULT_RESOURCE_COLOR,
  type ResourceColorKey,
} from "@/constants/colors";

export interface EntityEditDialogProps {
  open: boolean;
  /** "Category" | "Tag" — used in title/labels. */
  entityLabel: string;
  currentName: string;
  currentIcon: IconName | null;
  currentColor: ResourceColorKey | null;
  /** "categories" | "tags" — shown when no custom icon is set. */
  fallbackIcon: IconName;
  /** Existing names for duplicate validation; excludes currentName. */
  existingNames?: string[];
  onClose: () => void;
  onSubmit: (next: {
    name: string;
    icon: IconName | null;
    color: ResourceColorKey | null;
  }) => void | Promise<void>;
}

export function EntityEditDialog({
  open,
  entityLabel,
  currentName,
  currentIcon,
  currentColor,
  fallbackIcon,
  existingNames = [],
  onClose,
  onSubmit,
}: EntityEditDialogProps) {
  const [name, setName] = useState(currentName);
  const [icon, setIcon] = useState<IconName | null>(currentIcon);
  const [color, setColor] = useState<ResourceColorKey | null>(currentColor);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset local state whenever the dialog (re)opens for a different entity.
  useEffect(() => {
    if (open) {
      setName(currentName);
      setIcon(currentIcon);
      setColor(currentColor);
      setIconPickerOpen(false);
      setIsSubmitting(false);
    }
  }, [open, currentName, currentIcon, currentColor]);

  const trimmed = name.trim();
  // Case-insensitive duplicate check; currentName is never its own duplicate.
  const isDuplicate =
    trimmed.toLowerCase() !== currentName.toLowerCase() &&
    existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase());
  // A name change is not required — icon-only / color-only edits are saveable.
  const canSubmit = !!trimmed && !isDuplicate && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ name: trimmed, icon, color });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  const selectedColor = color ?? DEFAULT_RESOURCE_COLOR;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit ${entityLabel}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Icon */}
        <div className="space-y-2">
          <Label>Icon</Label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIconPickerOpen(true)}
              aria-label={`Choose icon for this ${entityLabel.toLowerCase()}`}
              className={`flex h-10 w-10 items-center justify-center rounded-lg border border-transparent transition-colors hover:border-border ${RESOURCE_COLORS[selectedColor].bg} ${RESOURCE_COLORS[selectedColor].text}`}
            >
              <Icon name={icon ?? fallbackIcon} size="md" />
            </button>
            {icon !== null && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIcon(null)}
                className="h-7 px-2 text-xs text-muted-foreground"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Color */}
        <div className="space-y-2">
          <Label>Color</Label>
          <div className="flex items-center gap-2">
            {RESOURCE_COLOR_KEYS.map((k) => (
              <button
                key={k}
                type="button"
                title={RESOURCE_COLORS[k].label}
                aria-label={RESOURCE_COLORS[k].label}
                onClick={() => setColor((cur) => (cur === k ? null : k))}
                className={`h-7 w-7 rounded-full transition-transform hover:scale-105 ${RESOURCE_COLORS[k].swatch} ${
                  color === k
                    ? "ring-2 ring-offset-2 ring-ring ring-offset-background"
                    : ""
                }`}
              />
            ))}
          </div>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="entity-name-input">{entityLabel} Name</Label>
          <Input
            id="entity-name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
      </div>

      <IconPicker
        open={iconPickerOpen}
        onClose={() => setIconPickerOpen(false)}
        value={icon}
        onSelect={setIcon}
        onClear={() => setIcon(null)}
        title={`Choose an icon for this ${entityLabel.toLowerCase()}`}
      />
    </Modal>
  );
}
