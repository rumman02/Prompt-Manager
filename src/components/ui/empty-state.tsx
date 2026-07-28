import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Icon, type IconName } from "@/components/ui/icon";

interface EmptyStateProps {
  icon: IconName;
  title: string;
  description: ReactNode;
}

/* Shared empty-state pattern: dashed-border card, centered icon tile,
   bold headline, muted description. */
export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <Card className="border-dashed shadow-none">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
          <Icon name={icon} size="xl" className="text-primary" />
        </div>
        <h3 className="text-headline font-medium">{title}</h3>
        <p className="mt-1 max-w-sm text-caption text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
