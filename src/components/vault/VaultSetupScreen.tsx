import { useVault } from "@/contexts/VaultContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Icon } from "@/components/ui/icon";
import { cn, formatDate } from "@/lib/utils";

export function VaultSetupScreen() {
  const { vaults, activeVault, loading, createVault, openVault, switchVault, removeVault, error } = useVault();

  return (
    <div className="flex min-h-screen items-center justify-center overflow-hidden bg-secondary/30 p-6">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
            <Icon name="folder" size="xl" className="text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Choose a vault</CardTitle>
          <CardDescription>
            Your prompts are stored as a database inside a folder you pick, so
            you can back it up, sync it, or re-open it after reinstalling.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {error && (
            <Alert variant="destructive">
              <Icon name="alert" size="md" className="h-4 w-4" />
              <AlertTitle>Vault error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : (
            vaults.length > 0 && (
              <div className="space-y-1">
                <p className="px-1 pb-1 pt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
                          missing ? "opacity-50" : "hover:border-border hover:bg-muted/50",
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
                                  <Badge
                                    variant="secondary"
                                    className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/10"
                                  >
                                    Active
                                  </Badge>
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
                                <Badge variant="secondary" className="rounded-full text-[10px] font-medium">
                                  Missing
                                </Badge>
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
              </div>
            )
          )}
        </CardContent>

        <CardFooter className="flex-col gap-2.5">
          <Button onClick={createVault} className="h-10 w-full gap-2">
            <Icon name="add" size="md" />
            Create new vault…
          </Button>
          <Button variant="outline" onClick={openVault} className="h-10 w-full gap-2">
            <Icon name="folder" size="md" />
            Open existing vault…
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
