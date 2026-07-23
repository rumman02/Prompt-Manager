import { Card, CardContent } from "@/components/ui/card";
import { STAT_CONFIGS } from "@/constants/stats";
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
      {STAT_CONFIGS.map((config, index) => {
        const Icon = config.icon;
        return (
          <Card key={config.title} className="border-0 shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${config.bgColor}`}>
                <Icon className={`h-5 w-5 ${config.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">{config.title}</p>
                <p className="text-2xl font-bold tracking-tight">{values[index]}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
