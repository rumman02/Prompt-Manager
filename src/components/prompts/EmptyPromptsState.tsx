import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";

interface EmptyPromptsStateProps {
  onLoadDemo?: () => void;
  icon?: IconName;
  title?: string;
  description?: string;
}

export function EmptyPromptsState({ onLoadDemo, icon = "file", title = "No prompts yet", description = "Create your first prompt or load demo prompts to get started." }: EmptyPromptsStateProps) {
  return (
    <Card className="border-dashed border-border/60 bg-transparent shadow-none">
      <CardContent className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
          <Icon name={icon} size="xl" className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
        {onLoadDemo && (
          <div className="mt-5">
            <Button variant="secondary" onClick={onLoadDemo} className="gap-2">
              <Icon name="sparkles" size="sm" />
              Load demo prompts
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
