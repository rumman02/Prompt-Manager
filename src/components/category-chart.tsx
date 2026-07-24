import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CategoryCount } from "@/types";

interface CategoryChartProps {
  categories: CategoryCount[];
}

export function CategoryChart({ categories }: CategoryChartProps) {
  return (
    <Card className="shadow-macos-window">
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
            <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-muted mb-3">
              <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <p className="text-caption text-muted-foreground">No category data yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

