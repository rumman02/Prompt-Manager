import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: ReactNode;
}

/* Shared empty-state pattern (reference: SkillsPage).
   Dashed-border card spanning the content width, centered icon tile,
   bold headline, and a muted description line below. */
export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <Card className="border-dashed shadow-none">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-[10px] bg-primary/10 mb-4">
          {icon}
        </div>
        <h3 className="text-headline font-medium">{title}</h3>
        <p className="mt-1 max-w-sm text-caption text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
