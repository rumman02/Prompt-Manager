import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import type { CategoryCount } from "@/types";

interface CategoryChartProps {
  categories: CategoryCount[];
}

export function CategoryChart({ categories }: CategoryChartProps) {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-headline font-semibold">Category Stats</CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length > 0 ? (
          <div className="divide-y">
            {categories.slice(0, 8).map((cat) => {
              return (
                <div key={cat.category} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <span className="text-subheadline font-medium text-foreground">{cat.category}</span>
                  <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary min-w-[2rem]">
                    {cat.count}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted mb-3">
              <Icon name="categories" size="xl" className="text-muted-foreground" />
            </div>
            <p className="text-caption text-muted-foreground">No category data yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
