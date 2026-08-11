import { useEffect, useState } from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { Icon } from "@/components/ui/icon";
import { useSettings, type LandingPage, type ThemeMode } from "@/contexts/SettingsContext";
import { useVault } from "@/contexts/VaultContext";
import type { VaultEntry } from "@/types";
import {
  ACCENT_PRESETS,
  LANGUAGES,
  DATE_FORMATS,
  LANDING_PAGES,
  FONT_FAMILIES,
  EDITOR_FONT_FAMILIES,
  FONT_SIZES,
} from "@/constants/settings";
import { THEMES } from "@/constants/themes";

interface VaultRenameDialogProps {
  open: boolean;
  currentName: string;
  existingNames: string[];
  onClose: () => void;
  onSubmit: (newName: string) => void;
}

function VaultRenameDialog({
  open,
  currentName,
  existingNames,
  onClose,
  onSubmit,
}: VaultRenameDialogProps) {
  const [value, setValue] = useState(currentName);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    toast.success("Vault renamed");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename Vault</DialogTitle>
          <DialogDescription>Choose a new name for this vault folder.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="vault-rename-input">Vault Name</Label>
          <Input
            id="vault-rename-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            autoFocus
          />
          {isDuplicate && (
            <p className="text-sm text-warning">A vault with this name already exists.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting ? "Renaming..." : "Rename"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CreateVaultDialogProps {
  open: boolean;
  existingNames: string[];
  onClose: () => void;
  onCreate: (dir: string, filename: string) => Promise<void>;
}

export function CreateVaultDialog({
  open,
  existingNames,
  onClose,
  onCreate,
}: CreateVaultDialogProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setLocation("");
      setIsSubmitting(false);
      setSubmitError(null);
    }
  }, [open]);

  const trimmed = name.trim();
  const filename = /\.db$/i.test(trimmed) ? trimmed : `${trimmed}.db`;
  const hasInvalidChars = /[\\/:]/.test(trimmed);
  const startsWithDot = trimmed.startsWith(".");
  const isDuplicate = existingNames.some(
    (n) => n.toLowerCase() === filename.toLowerCase(),
  );
  const isValid =
    !!trimmed && !hasInvalidChars && !startsWithDot && !isDuplicate;
  const canSubmit = isValid && !!location && !isSubmitting;

  const handleBrowse = async () => {
    const result = await openDialog({
      directory: true,
      multiple: false,
      title: "Choose location",
    });
    if (typeof result !== "string") return;
    setLocation(result);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onCreate(location, filename);
    } catch (e) {
      setSubmitError(String(e));
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create local vault</DialogTitle>
          <DialogDescription>
            Pick a name for your vault. It is stored as a single .db file.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vault-create-name">Vault name</Label>
            <Input
              id="vault-create-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              autoFocus
            />
            {!trimmed && (
              <p className="text-sm text-warning">Enter a vault name.</p>
            )}
            {trimmed && hasInvalidChars && (
              <p className="text-sm text-warning">
                Name cannot contain /, \, or :.
              </p>
            )}
            {trimmed && !hasInvalidChars && startsWithDot && (
              <p className="text-sm text-warning">Name cannot start with a dot.</p>
            )}
            {trimmed && !hasInvalidChars && !startsWithDot && isDuplicate && (
              <p className="text-sm text-warning">
                A vault with this name already exists.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <div className="flex items-center gap-2">
              <div
                className={`flex-1 truncate rounded-lg border border-transparent bg-muted px-3 py-2 text-sm ${
                  location ? "" : "text-muted-foreground"
                }`}
                title={location || undefined}
              >
                {location || "No location chosen"}
              </div>
              <Button type="button" variant="outline" onClick={handleBrowse}>
                Browse
              </Button>
            </div>
          </div>
          {location && trimmed && (
            <p className="truncate text-xs text-muted-foreground">
              {location}/{filename}
            </p>
          )}
        </div>
        {submitError && (
          <p className="text-sm text-destructive">{submitError}</p>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting ? "Creating..." : "Create vault"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { vaults, activeVault, openVault, switchVault, renameVault, removeVault, revealVault, createFileVault } =
    useVault();
  const [renamingVault, setRenamingVault] = useState<VaultEntry | null>(null);
  const [creatingVault, setCreatingVault] = useState(false);
  const handleSave = () => {
    toast.success("Settings saved");
  };

  const handleReset = () => {
    resetSettings();
    toast.success("Settings reset to defaults");
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        icon="settings"
        title="Settings"
        subtitle="Customize your Prompt Manager experience"
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <Tabs defaultValue="vault" className="w-full">
            <TabsList>
              <TabsTrigger value="vault">Vault</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="language">Language & Region</TabsTrigger>
              <TabsTrigger value="general">General</TabsTrigger>
            </TabsList>

            <TabsContent value="vault" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="folder" size="lg" className="text-primary" />
                    Vault
                  </CardTitle>
                  <CardDescription>
                    Your prompts are stored as a database inside a folder you choose
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div>
                      <Label>Active Vault</Label>
                      <p className="text-xs text-muted-foreground">The database currently in use</p>
                    </div>
                    {activeVault ? (
                      <div className="rounded-xl border bg-muted/30 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Icon name="check" size="md" className="text-primary" />
                          <span className="text-sm font-medium">{activeVault.name}</span>
                        </div>
                        <p className="mt-1 truncate font-mono text-xs text-muted-foreground" title={activeVault.path}>
                          {activeVault.path}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No vault is active.</p>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div>
                      <Label>Vault Actions</Label>
                      <p className="text-xs text-muted-foreground">
                        Open, create, or reveal your vault folders
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Button variant="outline" onClick={openVault} className="gap-2">
                        <Icon name="folder" size="md" />
                        Open existing vault…
                      </Button>
                      <Button variant="outline" onClick={() => setCreatingVault(true)} className="gap-2">
                        <Icon name="add" size="md" />
                        Create new vault…
                      </Button>
                      {activeVault && (
                        <Button
                          variant="outline"
                          onClick={() => revealVault(activeVault.id)}
                          className="gap-2"
                        >
                          <Icon name="search" size="md" />
                          Reveal in Finder
                        </Button>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div>
                      <Label>Registered Vaults</Label>
                      <p className="text-xs text-muted-foreground">
                        Click a vault to activate it. Renaming and removing only affects this list — files on disk are never deleted
                      </p>
                    </div>
                    <div className="space-y-2">
                      {vaults.length === 0 && (
                        <p className="text-sm text-muted-foreground">No vaults registered yet.</p>
                      )}
                      {vaults.map((vault) => {
                        const isActive = activeVault?.id === vault.id;
                        const missing = !vault.exists;
                        return (
                          <div
                            key={vault.id}
                            className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                              missing ? "border-border opacity-60" : "border-border"
                            }${!isActive && !missing ? " cursor-pointer hover:bg-accent/50 transition-colors" : ""}`}
                            onClick={() => {
                              if (!isActive && !missing) switchVault(vault.id);
                            }}
                            {...(!isActive && !missing
                              ? {
                                  role: "button",
                                  tabIndex: 0,
                                  onKeyDown: (e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      switchVault(vault.id);
                                    }
                                  },
                                }
                              : {})}
                          >
                            <Icon
                              name={isActive ? "check" : "folder"}
                              size="md"
                              className={`shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-sm font-medium">{vault.name}</span>
                                {isActive && (
                                  <Badge
                                    variant="secondary"
                                    className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/10"
                                  >
                                    Active
                                  </Badge>
                                )}
                                {missing && (
                                  <Badge variant="secondary" className="rounded-full text-[10px] font-medium">
                                    Missing
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground" title={vault.path}>
                                {vault.path}
                              </p>
                            </div>
                            <div
                              className="flex shrink-0 items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {!isActive && !missing && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => switchVault(vault.id)}
                                  className="gap-1.5"
                                  title="Make this the active vault"
                                >
                                  <Icon name="circleDot" size="sm" />
                                  Activate
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setRenamingVault(vault)}
                                className="gap-1.5"
                              >
                                <Icon name="edit" size="sm" />
                                Rename
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeVault(vault.id)}
                                className="gap-1.5 text-muted-foreground hover:text-destructive"
                                title="Removes from the list only — files on disk are not deleted"
                              >
                                <Icon name="delete" size="sm" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="palette" size="lg" className="text-primary" />
                    Appearance
                  </CardTitle>
                  <CardDescription>Customize the look and feel of the application</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div>
                      <Label>Accent Color</Label>
                      <p className="text-xs text-muted-foreground">
                        Override the default accent color across the app
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="color"
                        value={settings.accentColor}
                        onChange={(e) => updateSettings({ accentColor: e.target.value })}
                        className="h-9 w-14 cursor-pointer border-input bg-background p-1 shadow-sm"
                      />
                      <Input
                        value={settings.accentColor}
                        onChange={(e) => updateSettings({ accentColor: e.target.value })}
                        className="w-28 font-mono text-xs"
                        placeholder="#1e293b"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {ACCENT_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          onClick={() => updateSettings({ accentColor: preset.value })}
                          className={`group relative flex h-8 w-8 items-center justify-center rounded-md ring-2 ring-offset-2 ring-offset-background transition-all ${
                            settings.accentColor === preset.value
                              ? "scale-110 ring-primary"
                              : "ring-transparent hover:scale-110 hover:ring-border"
                          }`}
                          style={{ backgroundColor: preset.value }}
                          title={preset.name}
                        >
                          {settings.accentColor === preset.value && (
                            <Icon name="check" size="sm" className="text-white drop-shadow-md" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div>
                      <Label>Theme</Label>
                      <p className="text-xs text-muted-foreground">Choose from curated color themes</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {THEMES.map((theme) => {
                        const lightColors = theme.variants.light.colors;
                        const darkColors = theme.variants.dark.colors;
                        const isActive = settings.themePreset === theme.id;
                        return (
                          <button
                            key={theme.id}
                            onClick={() => updateSettings({ themePreset: theme.id })}
                            className={`group relative flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                              isActive
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-border hover:border-primary/30 hover:bg-muted/50"
                            }`}
                          >
                            <div className="flex shrink-0 flex-col gap-1">
                              <div
                                className="h-5 w-10 rounded-md border border-black/10"
                                style={{ background: lightColors.background }}
                              >
                                <div className="flex h-full items-center justify-center gap-0.5 px-1">
                                  <div
                                    className="h-2 w-2 rounded-full"
                                    style={{ background: lightColors.primary }}
                                  />
                                  <div
                                    className="h-2 w-2 rounded-full"
                                    style={{ background: lightColors.accent2 }}
                                  />
                                </div>
                              </div>
                              <div
                                className="h-5 w-10 rounded-md border border-white/10"
                                style={{ background: darkColors.background }}
                              >
                                <div className="flex h-full items-center justify-center gap-0.5 px-1">
                                  <div
                                    className="h-2 w-2 rounded-full"
                                    style={{ background: darkColors.primary }}
                                  />
                                  <div
                                    className="h-2 w-2 rounded-full"
                                    style={{ background: darkColors.accent2 }}
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-sm font-medium">{theme.name}</span>
                                {isActive && <Icon name="check" size="sm" className="shrink-0 text-primary" />}
                              </div>
                              <p className="mt-0.5 text-xs text-muted-foreground">{theme.description}</p>
                              <div className="mt-1.5 flex items-center gap-1.5">
                                <span className="text-[10px] font-medium text-muted-foreground">
                                  {theme.variants.light.name}
                                </span>
                                <Icon name="arrowRight" size="xs" className="text-muted-foreground" />
                                <span className="text-[10px] font-medium text-muted-foreground">
                                  {theme.variants.dark.name}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div>
                      <Label>Appearance</Label>
                      <p className="text-xs text-muted-foreground">Choose light, dark, or system appearance</p>
                    </div>
                    <RadioGroup
                      value={settings.theme}
                      onValueChange={(v) => updateSettings({ theme: v as ThemeMode })}
                      className="grid grid-cols-3 gap-3"
                    >
                      {(["light", "dark", "system"] as const).map((mode) => (
                        <div key={mode}>
                          <RadioGroupItem value={mode} id={`appearance-${mode}`} className="peer sr-only" />
                          <Label
                            htmlFor={`appearance-${mode}`}
                            className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                          >
                            {mode === "light" && <Icon name="sun" size="xl" />}
                            {mode === "dark" && <Icon name="moon" size="xl" />}
                            {mode === "system" && <Icon name="monitor" size="xl" />}
                            <span className="text-xs font-medium capitalize">{mode}</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <Label htmlFor="ui-font">UI Font</Label>
                        <p className="text-xs text-muted-foreground">Application interface font family</p>
                      </div>
                      <Select
                        value={settings.fontFamily}
                        onValueChange={(v) => updateSettings({ fontFamily: v })}
                      >
                        <SelectTrigger id="ui-font" className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FONT_FAMILIES.map((f) => (
                            <SelectItem key={f.value} value={f.value}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <Label htmlFor="editor-font">Editor Font</Label>
                        <p className="text-xs text-muted-foreground">Code editor monospace font</p>
                      </div>
                      <Select
                        value={settings.editorFontFamily}
                        onValueChange={(v) => updateSettings({ editorFontFamily: v })}
                      >
                        <SelectTrigger id="editor-font" className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EDITOR_FONT_FAMILIES.map((f) => (
                            <SelectItem key={f.value} value={f.value}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <Label htmlFor="font-size">Base Font Size</Label>
                        <p className="text-xs text-muted-foreground">Scale the app's text size</p>
                      </div>
                      <Select
                        value={settings.fontSize}
                        onValueChange={(v) => updateSettings({ fontSize: v })}
                      >
                        <SelectTrigger id="font-size" className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FONT_SIZES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="language" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="globe" size="lg" className="text-primary" />
                    Language & Region
                  </CardTitle>
                  <CardDescription>Set your display language and date formatting</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select
                        value={settings.language}
                        onValueChange={(v) => updateSettings({ language: v })}
                      >
                        <SelectTrigger id="language">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              {lang.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateFormat">Date Format</Label>
                      <Select
                        value={settings.dateFormat}
                        onValueChange={(v) => updateSettings({ dateFormat: v })}
                      >
                        <SelectTrigger id="dateFormat">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DATE_FORMATS.map((fmt) => (
                            <SelectItem key={fmt.value} value={fmt.value}>
                              {fmt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="general" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="settings" size="lg" className="text-primary" />
                    General
                  </CardTitle>
                  <CardDescription>Configure default behavior and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div>
                      <Label>Default Landing Page</Label>
                      <p className="text-xs text-muted-foreground">Which page to show on launch</p>
                    </div>
                    <RadioGroup
                      value={settings.landingPage}
                      onValueChange={(v) => updateSettings({ landingPage: v as LandingPage })}
                      className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                    >
                      {LANDING_PAGES.map((page) => (
                        <div key={page.value} className="flex items-start space-x-3 rounded-xl border-2 p-3">
                          <RadioGroupItem value={page.value} id={`landing-${page.value}`} />
                          <Label htmlFor={`landing-${page.value}`} className="font-normal">
                            <div className="text-sm font-medium">{page.label}</div>
                            <div className="text-xs text-muted-foreground">{page.description}</div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div>
                      <Label>Trash Retention Period</Label>
                      <p className="text-xs text-muted-foreground">
                        How long deleted items stay in Trash before being permanently purged
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Slider
                        min={1}
                        max={365}
                        step={1}
                        value={[settings.trashTimeout]}
                        onValueChange={(v) => updateSettings({ trashTimeout: v[0] })}
                        className="max-w-xs"
                      />
                      <Select
                        value={settings.trashTimeoutUnit}
                        onValueChange={(v) =>
                          updateSettings({ trashTimeoutUnit: v as "days" | "weeks" | "months" })
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="days">Days</SelectItem>
                          <SelectItem value="weeks">Weeks</SelectItem>
                          <SelectItem value="months">Months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Alert className="border-border bg-muted/30">
                      <Icon name="info" size="md" className="h-4 w-4 text-muted-foreground" />
                      <AlertTitle className="text-xs text-muted-foreground">
                        Items will be permanently deleted after{" "}
                        <span className="font-medium text-foreground">
                          {settings.trashTimeout} {settings.trashTimeoutUnit}
                        </span>{" "}
                        in Trash.
                      </AlertTitle>
                      <AlertDescription className="text-xs text-muted-foreground">
                        Set a longer period to avoid accidental data loss.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-between pb-6">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Icon name="reset" size="md" />
                  Reset to Defaults
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset settings to defaults?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This restores every setting to its default value. Your prompts and vault are
                    not affected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={handleSave} className="min-w-[140px] gap-2">
              <Icon name="save" size="md" />
              Save Settings
            </Button>
          </div>
        </div>
      </div>

      <VaultRenameDialog
        open={!!renamingVault}
        currentName={renamingVault?.name ?? ""}
        existingNames={vaults
          .filter((v) => v.id !== renamingVault?.id)
          .map((v) => v.name)}
        onClose={() => setRenamingVault(null)}
        onSubmit={(newName) => {
          if (renamingVault) {
            renameVault(renamingVault.id, newName);
            setRenamingVault(null);
          }
        }}
      />
      <CreateVaultDialog
        open={creatingVault}
        existingNames={vaults.map((v) => v.name)}
        onClose={() => setCreatingVault(false)}
        onCreate={createFileVault}
      />
    </div>
  );
}
