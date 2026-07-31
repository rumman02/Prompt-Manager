import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchBar } from "@/components/search-bar";
import { Icon } from "@/components/ui/icon";
import { useSettings, type LandingPage } from "@/contexts/SettingsContext";
import { ACCENT_PRESETS, LANGUAGES, DATE_FORMATS, LANDING_PAGES, FONT_FAMILIES, EDITOR_FONT_FAMILIES, FONT_SIZES } from "@/constants/settings";
import { THEMES } from "@/constants/themes";

export function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [saved, setSaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    resetSettings();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        icon="settings"
        title="Settings"
        subtitle="Customize your Prompt Manager experience"
        actions={
          <div className="flex items-center gap-3">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search settings..."
            />
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-6">
      <div className="mx-auto max-w-3xl space-y-6">
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
              <Label className="text-subheadline">Accent Color</Label>
              <p className="text-footnote mt-0.5">
                Override the default accent color across the app
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="color"
                  value={settings.accentColor}
                  onChange={(e) => updateSettings({ accentColor: e.target.value })}
                  className="h-9 w-14 cursor-pointer rounded-md border border-input bg-background shadow-sm"
                />
              </div>
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
                      ? "ring-primary scale-110"
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
              <Label className="text-subheadline">Theme</Label>
              <p className="text-footnote mt-0.5">
                Choose from curated color themes
              </p>
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
                    {/* Theme preview swatches */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <div
                        className="h-5 w-10 rounded-md border border-black/10"
                        style={{ background: lightColors.background }}
                      >
                        <div className="flex h-full items-center justify-center gap-0.5 px-1">
                          <div className="h-2 w-2 rounded-full" style={{ background: lightColors.primary }} />
                          <div className="h-2 w-2 rounded-full" style={{ background: lightColors.accent2 }} />
                        </div>
                      </div>
                      <div
                        className="h-5 w-10 rounded-md border border-white/10"
                        style={{ background: darkColors.background }}
                      >
                        <div className="flex h-full items-center justify-center gap-0.5 px-1">
                          <div className="h-2 w-2 rounded-full" style={{ background: darkColors.primary }} />
                          <div className="h-2 w-2 rounded-full" style={{ background: darkColors.accent2 }} />
                        </div>
                      </div>
                    </div>
                    {/* Theme info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{theme.name}</span>
                        {isActive && (
                          <Icon name="check" size="sm" className="text-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{theme.description}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[10px] font-medium text-muted-foreground">{theme.variants.light.name}</span>
                        <Icon name="arrowRight" size="xs" className="text-muted-foreground" />
                        <span className="text-[10px] font-medium text-muted-foreground">{theme.variants.dark.name}</span>
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
              <Label className="text-subheadline">Appearance</Label>
              <p className="text-footnote mt-0.5">
                Choose light, dark, or system appearance
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(["light", "dark", "system"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => updateSettings({ theme: mode })}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                    settings.theme === mode
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/30 hover:bg-muted/50"
                  }`}
                >
                  {mode === "light" && <Icon name="sun" size="xl" />}
                  {mode === "dark" && <Icon name="moon" size="xl" />}
                  {mode === "system" && <Icon name="monitor" size="xl" />}
                  <span className="text-xs font-medium capitalize">{mode}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-subheadline">UI Font</Label>
                <p className="text-footnote mt-0.5">Application interface font family</p>
              </div>
              <Dropdown
                value={settings.fontFamily}
                onChange={(v) => updateSettings({ fontFamily: v })}
                className="w-48"
                options={FONT_FAMILIES.map((f) => ({ value: f.value, label: f.label }))}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-subheadline">Editor Font</Label>
                <p className="text-footnote mt-0.5">Code editor monospace font</p>
              </div>
              <Dropdown
                value={settings.editorFontFamily}
                onChange={(v) => updateSettings({ editorFontFamily: v })}
                className="w-48"
                options={EDITOR_FONT_FAMILIES.map((f) => ({ value: f.value, label: f.label }))}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-subheadline">Base Font Size</Label>
                <p className="text-footnote mt-0.5">Scale the app's text size</p>
              </div>
              <Dropdown
                value={settings.fontSize}
                onChange={(v) => updateSettings({ fontSize: v })}
                className="w-28"
                options={FONT_SIZES.map((s) => ({ value: s.value, label: s.label }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

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
              <Dropdown
                id="language"
                value={settings.language}
                onChange={(v) => updateSettings({ language: v })}
                options={LANGUAGES.map((lang) => ({ value: lang.code, label: lang.label }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFormat">Date Format</Label>
              <Dropdown
                id="dateFormat"
                value={settings.dateFormat}
                onChange={(v) => updateSettings({ dateFormat: v })}
                options={DATE_FORMATS.map((fmt) => ({ value: fmt.value, label: fmt.label }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

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
              <Label className="text-subheadline">Default Landing Page</Label>
              <p className="text-footnote mt-0.5">Which page to show on launch</p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {LANDING_PAGES.map((page) => (
                <button
                  key={page.value}
                  onClick={() => updateSettings({ landingPage: page.value })}
                  className={`flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                    settings.landingPage === page.value
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/30 hover:bg-muted/50"
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      settings.landingPage === page.value
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/40"
                    }`}
                  >
                    {settings.landingPage === page.value && (
                      <Icon name="check" size="xs" className="text-primary-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{page.label}</div>
                    <div className="text-xs text-muted-foreground">{page.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div>
              <Label className="text-subheadline">Trash Retention Period</Label>
              <p className="text-footnote mt-0.5">
                How long deleted items stay in Trash before being permanently purged
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={1}
                max={365}
                value={settings.trashTimeout}
                onChange={(e) =>
                  updateSettings({ trashTimeout: Math.max(1, parseInt(e.target.value) || 1) })
                }
                className="w-24"
              />
              <Dropdown
                value={settings.trashTimeoutUnit}
                onChange={(v) =>
                  updateSettings({ trashTimeoutUnit: v as "days" | "weeks" | "months" })
                }
                className="w-32"
                options={[
                  { value: "days", label: "Days" },
                  { value: "weeks", label: "Weeks" },
                  { value: "months", label: "Months" },
                ]}
              />
            </div>
            <div className="rounded-xl border bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-2">
                <Icon name="info" size="md" className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Items will be permanently deleted after{" "}
                  <span className="font-medium text-foreground">
                    {settings.trashTimeout} {settings.trashTimeoutUnit}
                  </span>{" "}
                  in Trash. Set a longer period to avoid accidental data loss.
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between pb-6">
        <Button variant="ghost" onClick={handleReset} className="gap-2">
          <Icon name="reset" size="md" />
          Reset to Defaults
        </Button>
        <Button onClick={handleSave} className="gap-2 min-w-[140px]">
          {saved ? (
            <>
              <Icon name="check" size="md" />
              Saved!
            </>
          ) : (
            <>
              <Icon name="save" size="md" />
              Save Settings
            </>
          )}
        </Button>
      </div>
      </div>
      </div>
      </div>
  );
}
