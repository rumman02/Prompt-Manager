import { useEffect, useRef, type JSX } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export interface InfiniteScrollSentinelProps {
  onIntersect: () => void;
  hasMore: boolean;
  isLoading: boolean;
  className?: string;
}

export function InfiniteScrollSentinel({
  onIntersect,
  hasMore,
  isLoading,
  className,
}: InfiniteScrollSentinelProps): JSX.Element | null {
  const ref = useRef<HTMLDivElement | null>(null);
  const onIntersectRef = useRef(onIntersect);
  onIntersectRef.current = onIntersect;

  useEffect(() => {
    if (!hasMore) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && !isLoading) {
          onIntersectRef.current();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onIntersect, hasMore, isLoading]);

  if (!hasMore) return null;

  return (
    <div ref={ref} className={cn("flex justify-center py-6", className)}>
      {isLoading ? (
        <div className="flex items-center gap-3">
          <Skeleton className="size-4 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      ) : (
        <div aria-hidden="true" className="h-px w-px" />
      )}
    </div>
  );
}