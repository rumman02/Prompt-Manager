import { Card, CardContent } from "@/components/ui/card";
import { STAT_CONFIGS } from "@/constants/stats";
import { Icon, type IconName } from "@/components/ui/icon";
import type { Stats } from "@/hooks/useStats";

interface StatsCardsProps {
  stats: Stats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const values = [
    stats.totalAgents,
    stats.totalSkills,
    stats.totalPrompts,
    stats.totalCategories,
    stats.favoritesCount,
    stats.tagsCount,
    stats.trashCount,
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {STAT_CONFIGS.map((config, index) => (
        <Card key={config.title} className="border-0 shadow-none bg-transparent">
          <CardContent className="flex items-center gap-4 p-4 pt-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon name={config.icon as IconName} size="lg" className="text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-caption text-muted-foreground">{config.title}</p>
              <p className="text-title tracking-tight">{values[index]}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
