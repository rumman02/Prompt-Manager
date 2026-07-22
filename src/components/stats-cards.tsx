import { Card, CardContent } from "@/components/ui/card";
import { STAT_CONFIGS } from "@/constants/stats";
import type { Stats } from "@/hooks/useStats";

interface StatsCardsProps {
  stats: Stats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const values = [
    stats.totalPrompts,
    stats.activePrompts,
    Math.round(stats.avgTokensPerPrompt),
    stats.favoritesCount,
    stats.totalCategories,
    stats.totalTags,
    stats.newThisWeek,
    stats.popularCategory || "—",
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {STAT_CONFIGS.map((config, index) => (
        <Card key={config.title} className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${config.bgColor}`}>
              <span className={config.color}>{config.icon}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{config.title}</p>
              <p className="text-2xl font-bold tracking-tight">{values[index]}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
