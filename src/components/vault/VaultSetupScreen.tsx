import { useVault } from "@/contexts/VaultContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function VaultSetupScreen() {
  const { vaults, activeVault, createVault, openVault, switchVault, removeVault, error } = useVault();

  return (
    <div className="flex h-screen w-screen items-center justify-center overflow-hidden bg-secondary/30">
      <div className="w-full max-w-md px-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
            <Icon name="folder" size="xl" className="text-muted-foreground" />
          </div>
          <h1 className="text-headline">Choose a vault</h1>
          <p className="mt-1.5 max-w-sm text-body text-muted-foreground">
            Your prompts are stored as a database inside a folder you pick, so
            you can back it up, sync it, or re-open it after reinstalling.
          </p>
        </div>

        {error && (
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
            <Icon name="alert" size="md" className="mt-0.5 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2.5">
          <Button onClick={createVault} className="h-10 gap-2">
            <Icon name="add" size="md" />
            Create new vault…
          </Button>
          <Button variant="outline" onClick={openVault} className="h-10 gap-2">
            <Icon name="folder" size="md" />
            Open existing vault…
          </Button>
        </div>

        {vaults.length > 0 && (
          <Card className="mt-8 border shadow-sm">
            <CardContent className="p-3">
              <p className="px-2 pb-2 pt-1 text-footnote font-medium uppercase tracking-wide text-muted-foreground">
                Previously used
              </p>
              <div className="space-y-1">
                {vaults.map((vault) => {
                  const isActive = activeVault?.id === vault.id;
                  const missing = !vault.exists;
                  return (
                    <div
                      key={vault.id}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border border-transparent px-2.5 py-2 text-left transition-colors",
                        missing
                          ? "opacity-50"
                          : "hover:border-border hover:bg-muted/50",
                      )}
                    >
                      {!missing && (
                        <button
                          type="button"
                          onClick={() => switchVault(vault.id)}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        >
                          <Icon
                            name={isActive ? "check" : "folder"}
                            size="md"
                            className={cn("shrink-0", isActive ? "text-primary" : "text-muted-foreground")}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="truncate text-sm font-medium">{vault.name}</span>
                              {isActive && (
                                <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                  Active
                                </span>
                              )}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {vault.path}
                              {vault.last_opened_at ? ` · Opened ${formatDate(vault.last_opened_at)}` : ""}
                            </span>
                          </span>
                        </button>
                      )}
                      {missing && (
                        <span className="flex min-w-0 flex-1 items-center gap-3">
                          <Icon name="folder" size="md" className="shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="truncate text-sm font-medium">{vault.name}</span>
                              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                Missing
                              </span>
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">{vault.path}</span>
                          </span>
                        </span>
                      )}
                      {missing && (
                        <button
                          type="button"
                          onClick={() => removeVault(vault.id)}
                          className="shrink-0 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          Remove from list
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
