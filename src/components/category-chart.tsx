import * as React from "react";
import { Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Icon } from "@/components/ui/icon";
import type { CategoryCount } from "@/types";

interface CategoryChartProps {
  categories: CategoryCount[];
}

const CHART_TOKEN_KEYS = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"] as const;

export function CategoryChart({ categories }: CategoryChartProps) {
  const top = categories.slice(0, 8);

  const chartConfig = React.useMemo(() => {
    const entries = top.map((cat, index) => [
      `category-${index}`,
      {
        label: cat.category,
        color: `hsl(var(--${CHART_TOKEN_KEYS[index % CHART_TOKEN_KEYS.length]}))`,
      },
    ]);
    return Object.fromEntries(entries) as ChartConfig;
  }, [top]);

  const chartData = React.useMemo(() => {
    return top.map((cat, index) => ({
      key: `category-${index}`,
      category: cat.category,
      count: cat.count,
      fill: `var(--color-category-${index})`,
    }));
  }, [top]);

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Category Stats</CardTitle>
        <CardDescription>Prompt counts by category</CardDescription>
      </CardHeader>
      <CardContent>
        {categories.length > 0 ? (
          <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[280px]">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="key"
                innerRadius={45}
                outerRadius={80}
                paddingAngle={2}
                strokeWidth={2}
              />
              <ChartLegend content={<ChartLegendContent nameKey="key" />} />
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <Icon name="categories" className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No category data yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
