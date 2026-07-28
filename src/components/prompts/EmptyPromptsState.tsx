import { Icon, type IconName } from "@/components/ui/icon";

interface EmptyPromptsStateProps {
  onLoadDemo?: () => void;
  icon?: IconName;
  title?: string;
  description?: string;
}

export function EmptyPromptsState({ onLoadDemo, icon = "file", title = "No prompts yet", description = "Create your first prompt or load demo prompts to get started." }: EmptyPromptsStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted mb-5">
        <Icon name={icon} size="xl" className="text-muted-foreground" />
      </div>
      <h3 className="text-headline">{title}</h3>
      <p className="mt-1.5 text-body text-muted-foreground max-w-sm">{description}</p>
      {onLoadDemo && (
        <div className="mt-5">
          <button
            onClick={onLoadDemo}
            className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/80 transition-colors duration-150"
          >
            Load demo prompts
          </button>
        </div>
      )}
    </div>
  );
}
