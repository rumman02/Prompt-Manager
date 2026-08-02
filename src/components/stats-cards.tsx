import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { STAT_CONFIGS } from "@/constants/stats";
import { Icon, type IconName } from "@/components/ui/icon";
import type { Stats } from "@/hooks/useStats";

interface StatsCardsProps {
  stats: Stats;
  /** When true, renders skeleton placeholders instead of numbers */
  loading?: boolean;
}

export function StatsCards({ stats, loading = false }: StatsCardsProps) {
  const values = [
    stats.totalAgents,
    stats.totalSkills,
    stats.totalPrompts,
    stats.totalCategories,
    stats.favoritesCount,
    stats.tagsCount,
    stats.trashCount,
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {STAT_CONFIGS.map((config) => (
          <Card key={config.title}>
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-12" />
              </div>
              <Skeleton className="size-9 rounded-lg" />
            </CardHeader>
            <CardContent className="pb-2">
              <Skeleton className="h-5 w-20" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-3 w-24" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {STAT_CONFIGS.map((config, index) => (
        <Card key={config.title} className="flex flex-col">
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
            <div className="flex flex-col gap-1">
              <CardDescription className="text-sm font-medium text-muted-foreground">
                {config.title}
              </CardDescription>
              <CardTitle className="text-3xl font-bold tracking-tight tabular-nums">
                {values[index]}
              </CardTitle>
            </div>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon name={config.icon as IconName} className="size-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <Badge variant="secondary" className="gap-1 font-normal text-muted-foreground">
              <Icon name={config.icon as IconName} className="size-3" />
              {values[index]} total
            </Badge>
          </CardContent>
          <CardFooter className="mt-auto text-xs text-muted-foreground">
            {config.hint}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
