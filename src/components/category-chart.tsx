import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CategoryCount } from "@/types";

interface CategoryChartProps {
  categories: CategoryCount[];
}

const colors = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-pink-500",
];

export function CategoryChart({ categories }: CategoryChartProps) {
  const total = categories.reduce((sum, c) => sum + c.count, 0);
  const maxCount = Math.max(...categories.map((c) => c.count), 1);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Categories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.length > 0 ? (
          <>
            {/* Mini bar chart */}
            <div className="space-y-2.5">
              {categories.slice(0, 8).map((cat, i) => {
                const percentage = (cat.count / maxCount) * 100;
                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{cat.category}</span>
                      <span className="text-muted-foreground">{cat.count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${colors[i % colors.length]} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Donut-style distribution */}
            {categories.length > 1 && (
              <div className="pt-2">
                <div className="flex h-3 w-full overflow-hidden rounded-full">
                  {categories.map((cat, i) => {
                    const pct = (cat.count / total) * 100;
                    return (
                      <div
                        key={cat.category}
                        className={`${colors[i % colors.length]} transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    );
                  })}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-1.5">
                  {categories.slice(0, 6).map((cat, i) => (
                    <div key={cat.category} className="flex items-center gap-1.5 text-xs">
                      <div className={`h-2.5 w-2.5 rounded-sm ${colors[i % colors.length]}`} />
                      <span className="text-muted-foreground truncate">{cat.category}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
              <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1..125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">No category data yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
