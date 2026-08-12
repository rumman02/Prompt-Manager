import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface PageResult<T> {
  items: T[];
  total: number;
}

export interface PaginatedListOptions {
  command: string;
  pageSize?: number;
  search?: string;
  sort?: string;
  extraArgs?: Record<string, unknown>;
  enabled?: boolean;
}

interface PagingParams {
  command: string;
  pageSize: number;
  search: string;
  sort: string;
  extraArgs: Record<string, unknown>;
}

const DEBOUNCE_MS = 250;

function errorToString(e: unknown): string {
  return typeof e === "string" ? e : e instanceof Error ? e.message : String(e);
}

export function usePaginatedList<T>(options: PaginatedListOptions) {
  const { command, pageSize = 50, search, sort, extraArgs, enabled = true } = options;

  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  const [debouncedSearch, setDebouncedSearch] = useState(search ?? "");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search ?? ""), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  const paramsRef = useRef<PagingParams>({
    command,
    pageSize,
    search: debouncedSearch,
    sort: sort ?? "",
    extraArgs: extraArgs ?? {},
  });
  paramsRef.current = { command, pageSize, search: debouncedSearch, sort: sort ?? "", extraArgs: extraArgs ?? {} };

  const offsetRef = useRef(0);
  const totalRef = useRef(0);
  const seqRef = useRef(0);
  const inFlightRef = useRef(false);

  // extraArgs compared by value (JSON), not identity, so a fresh object literal
  // per render does not reset the list.
  const extraArgsKey = JSON.stringify(extraArgs ?? {});

  useEffect(() => {
    if (!enabled) {
      seqRef.current += 1;
      inFlightRef.current = false;
      setIsLoading(false);
      setIsLoadingMore(false);
      return;
    }

    const seq = ++seqRef.current;
    offsetRef.current = 0;
    inFlightRef.current = true;
    setIsLoading(true);
    setIsLoadingMore(false);
    setError(null);

    const params = paramsRef.current;
    invoke<PageResult<T>>(params.command, {
      limit: params.pageSize,
      offset: 0,
      ...(params.search ? { search: params.search } : {}),
      ...(params.sort ? { sort: params.sort } : {}),
      ...params.extraArgs,
    })
      .then((result) => {
        if (seq !== seqRef.current) return;
        totalRef.current = result.total;
        offsetRef.current = result.items.length;
        setTotal(result.total);
        setItems(result.items);
      })
      .catch((e) => {
        if (seq !== seqRef.current) return;
        setError(errorToString(e));
      })
      .finally(() => {
        if (seq === seqRef.current) {
          inFlightRef.current = false;
          setIsLoading(false);
        }
      });
  }, [command, debouncedSearch, sort, extraArgsKey, enabled, reloadNonce]);

  const loadMore = useCallback(async () => {
    if (inFlightRef.current || offsetRef.current >= totalRef.current) return;
    const seq = ++seqRef.current;
    inFlightRef.current = true;
    setIsLoadingMore(true);
    setError(null);

    const params = paramsRef.current;
    try {
      const result = await invoke<PageResult<T>>(params.command, {
        limit: params.pageSize,
        offset: offsetRef.current,
        ...(params.search ? { search: params.search } : {}),
        ...(params.sort ? { sort: params.sort } : {}),
        ...params.extraArgs,
      });
      if (seq !== seqRef.current) return;
      totalRef.current = result.total;
      offsetRef.current += result.items.length;
      setTotal(result.total);
      setItems((prev) => [...prev, ...result.items]);
    } catch (e) {
      if (seq !== seqRef.current) return;
      setError(errorToString(e));
    } finally {
      if (seq === seqRef.current) {
        inFlightRef.current = false;
        setIsLoadingMore(false);
      }
    }
  }, []);

  const reload = useCallback(() => {
    setReloadNonce((n) => n + 1);
  }, []);

  return {
    items,
    total,
    isLoading,
    isLoadingMore,
    error,
    hasMore: items.length < total,
    loadMore,
    reload,
  };
}