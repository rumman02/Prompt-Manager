import { useEffect, useMemo, useRef, useState } from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { invoke } from "@tauri-apps/api/core"
import { Command as CommandPrimitive } from "cmdk"
import { Search, Settings, X } from "lucide-react"
import { NAV_ITEMS, type ViewType } from "@/constants/nav"
import { ICON_MAP, Icon, type IconName } from "@/components/ui/icon"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { GlobalSearchHit, PromptRow } from "@/types"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

/** Rows rendered per group before the "show more" row appears. */
const GROUP_PAGE_SIZE = 5

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: (view: ViewType) => void
  onSelectEntity: (hit: GlobalSearchHit) => void
  /** Already-loaded prompts, shown as recents when the search is empty. */
  recentPrompts?: PromptRow[]
}

interface PageEntry {
  id: ViewType
  label: string
  icon: IconName | null
}

const PAGES: PageEntry[] = [
  ...NAV_ITEMS.map((item) => ({ id: item.id, label: item.label, icon: item.icon })),
  { id: "settings" as ViewType, label: "Settings", icon: null },
]

/** Small keycap used in the footer hint bar. */
function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-muted px-1 font-mono text-[10px] font-semibold text-muted-foreground">
      {children}
    </kbd>
  )
}

/**
 * Group of results with a count in the heading and lazy row rendering — only
 * GROUP_PAGE_SIZE rows mount until the user expands, so a wide backend result
 * set never floods the DOM.
 */
function ResultGroup({
  heading,
  items,
  renderItem,
  onExpand,
}: {
  heading: string
  items: GlobalSearchHit[]
  renderItem: (hit: GlobalSearchHit) => React.ReactNode
  /** Called with the first newly-revealed hit so the caller can move the highlight. */
  onExpand?: (first: GlobalSearchHit | undefined) => void
}) {
  const [expanded, setExpanded] = useState(false)

  // Collapse again whenever this group's contents change (i.e. a new query).
  useEffect(() => {
    setExpanded(false)
  }, [items])

  if (items.length === 0) return null
  const visible = expanded ? items : items.slice(0, GROUP_PAGE_SIZE)
  const hidden = items.length - visible.length

  return (
    <CommandGroup
      heading={
        <span className="flex items-center gap-1.5">
          {heading}
          <span className="text-[10px] font-normal tabular-nums text-muted-foreground/70">
            {items.length}
          </span>
        </span>
      }
    >
      {visible.map(renderItem)}
      {hidden > 0 && (
        <CommandItem
          value={`__more_${heading}`}
          onSelect={() => {
            setExpanded(true)
            onExpand?.(items[GROUP_PAGE_SIZE])
          }}
          className="text-xs text-muted-foreground"
        >
          <span className="pl-6">Show {hidden} more…</span>
        </CommandItem>
      )}
    </CommandGroup>
  )
}

export function CommandPalette({
  open,
  onOpenChange,
  onNavigate,
  onSelectEntity,
  recentPrompts,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("")
  const [hits, setHits] = useState<GlobalSearchHit[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState("")
  const requestSeq = useRef(0)
  const mounted = useRef(true)
  const inputRef = useRef<HTMLInputElement>(null)
  /**
   * The element focused before the palette opened. Radix only auto-restores
   * focus to a DialogTrigger, and this palette is opened from a plain sidebar
   * button or the Cmd/Ctrl+K shortcut — so we capture and restore it ourselves.
   */
  const restoreFocusTo = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (open) {
      const active = document.activeElement
      restoreFocusTo.current = active instanceof HTMLElement ? active : null
    }
  }, [open])

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  // Cmd/Ctrl+K toggles the palette open.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        onOpenChange(true)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onOpenChange])

  // Reset state whenever the dialog closes.
  useEffect(() => {
    if (!open) {
      requestSeq.current++ // invalidate any in-flight search
      setQuery("")
      setHits([])
      setLoading(false)
    }
  }, [open])

  // Debounced backend search. On ANY error we fall back to empty hits — the
  // Pages group (local NAV_ITEMS) still renders, so nothing crashes and no raw
  // Tauri error is surfaced. Stale/out-of-order responses are dropped via seq:
  // a response is only applied if its seq is still the newest issued.
  useEffect(() => {
    const q = query.trim()
    if (!q) {
      requestSeq.current++
      setHits([])
      setLoading(false)
      return
    }
    const seq = ++requestSeq.current
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const result = await invoke<GlobalSearchHit[]>("global_search", {
          query: q,
          limit: 50,
        })
        if (seq === requestSeq.current && mounted.current) {
          setHits(result)
          setLoading(false)
        }
      } catch (err) {
        console.error("Global search failed:", err)
        if (seq === requestSeq.current && mounted.current) {
          setHits([])
          setLoading(false)
        }
      }
    }, 150)
    return () => clearTimeout(timer)
  }, [query])

  const trimmed = query.trim()
  const querying = trimmed.length > 0

  // We drive filtering ourselves (shouldFilter={false} below) so that group
  // counts reflect exactly what is rendered — cmdk's own fuzzy filter would
  // hide rows the backend matched on body text and desync the counts.
  const pages = useMemo(() => {
    if (!querying) return PAGES
    const needle = trimmed.toLowerCase()
    return PAGES.filter((p) => p.label.toLowerCase().includes(needle))
  }, [querying, trimmed])

  const promptHits = useMemo(() => hits.filter((h) => h.kind === "prompt"), [hits])
  const categoryHits = useMemo(() => hits.filter((h) => h.kind === "category"), [hits])
  const tagHits = useMemo(() => hits.filter((h) => h.kind === "tag"), [hits])

  const recents = useMemo<GlobalSearchHit[]>(
    () =>
      (recentPrompts ?? []).slice(0, GROUP_PAGE_SIZE).map((p) => ({
        id: String(p.id),
        kind: "prompt" as const,
        title: p.title,
        subtitle: p.category,
        snippet: null,
      })),
    [recentPrompts]
  )

  const totalResults = querying
    ? pages.length + hits.length
    : pages.length + recents.length

  const pickEntity = (hit: GlobalSearchHit) => {
    onSelectEntity(hit)
    onOpenChange(false)
  }

  // cmdk skips its own "re-select the first row" pass when shouldFilter is
  // false, so we drive the highlight ourselves. `firstValue` only changes when
  // the query or the hit set changes — arrowing around in between leaves the
  // user's selection alone.
  const firstValue = useMemo(() => {
    if (pages.length > 0) return `page-${pages[0].id}`
    const first = querying ? hits[0] : recents[0]
    return first ? `${first.kind}-${first.id}` : ""
  }, [pages, querying, hits, recents])

  useEffect(() => {
    setSelected(firstValue)
  }, [firstValue])

  /** After a group expands, move the highlight onto the first revealed row. */
  const revealSelection = (first: GlobalSearchHit | undefined) => {
    if (first) setSelected(`${first.kind}-${first.id}`)
  }

  const entityRow = (icon: IconName) => (hit: GlobalSearchHit) => (
    <CommandItem
      key={`${hit.kind}-${hit.id}`}
      value={`${hit.kind}-${hit.id}`}
      onSelect={() => pickEntity(hit)}
    >
      <Icon name={icon} />
      <span className="flex-1 truncate">{hit.title}</span>
      {hit.subtitle && (
        <span className="max-w-[40%] shrink-0 truncate text-xs text-muted-foreground">
          {hit.subtitle}
        </span>
      )}
    </CommandItem>
  )

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "motion-reduce:animate-none motion-reduce:transition-none"
          )}
        />
        <DialogPrimitive.Content
          onOpenAutoFocus={(e) => {
            // Focus the query input rather than the first row.
            e.preventDefault()
            inputRef.current?.focus()
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault()
            restoreFocusTo.current?.focus()
          }}
          className={cn(
            // Centered via inset-x-0 + mx-auto rather than -translate-x-1/2:
            // the enter/exit keyframes own `transform`, so a centering
            // translate gets clobbered mid-animation - that is what made the
            // panel look like it flew in from the right.
            "fixed inset-x-0 top-[12%] z-50 mx-auto w-[calc(100%-2rem)] max-w-[640px]",
            "overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground",
            "shadow-2xl shadow-black/25 ring-1 ring-black/5 duration-200",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            // Grows out of / collapses back toward the sidebar search field on
            // the left, so the overlay reads as coming from that field.
            "origin-left data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-8 data-[state=open]:slide-in-from-left-8",
            "motion-reduce:animate-none motion-reduce:transition-none"
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            Search everything
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Search prompts, categories and tags, or jump to a page.
          </DialogPrimitive.Description>

          <Command
            shouldFilter={false}
            loop
            value={selected}
            onValueChange={setSelected}
            aria-label="Search everything"
            className={cn(
              "bg-transparent",
              // Selected row. NOTE: this theme's --accent is a near-invisible
              // grey (210 40% 96.1% light / 217 33% 17.5% dark), so bg-accent
              // alone reads as "barely highlighted". We tint with primary and
              // add a left accent bar instead. cmdk selects on pointer-move, so
              // hover and keyboard selection are intentionally the same state.
              "[&_[cmdk-item]]:relative [&_[cmdk-item]]:cursor-pointer [&_[cmdk-item]]:rounded-md [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-2",
              "[&_[cmdk-item][data-selected=true]]:bg-primary/10 [&_[cmdk-item][data-selected=true]]:font-medium [&_[cmdk-item][data-selected=true]]:text-foreground",
              "[&_[cmdk-item][data-selected=true]]:before:absolute [&_[cmdk-item][data-selected=true]]:before:left-0 [&_[cmdk-item][data-selected=true]]:before:top-1/2 [&_[cmdk-item][data-selected=true]]:before:h-5 [&_[cmdk-item][data-selected=true]]:before:w-[3px] [&_[cmdk-item][data-selected=true]]:before:-translate-y-1/2 [&_[cmdk-item][data-selected=true]]:before:rounded-full [&_[cmdk-item][data-selected=true]]:before:bg-primary",
              "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground"
            )}
          >
            {/* Search row */}
            <div className="flex items-center gap-2.5 border-b border-border px-4">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <CommandPrimitive.Input
                ref={inputRef}
                value={query}
                onValueChange={setQuery}
                placeholder="Search prompts, categories, tags…"
                className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setQuery("")
                    inputRef.current?.focus()
                  }}
                  className="rounded-sm p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <CommandList className="max-h-[60vh] overflow-y-auto overflow-x-hidden p-2">
              {loading && hits.length === 0 ? (
                <div className="space-y-2 p-2" aria-label="Loading results">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <Skeleton className="size-4 rounded" />
                      <Skeleton className="h-3.5 flex-1" />
                    </div>
                  ))}
                </div>
              ) : (
                <CommandEmpty className="px-4 py-10 text-center">
                  <p className="text-sm font-medium">No results</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Nothing matches “{trimmed}”. Try a different term.
                  </p>
                </CommandEmpty>
              )}

              {pages.length > 0 && (
                <CommandGroup
                  heading={
                    <span className="flex items-center gap-1.5">
                      Pages
                      <span className="text-[10px] font-normal tabular-nums text-muted-foreground/70">
                        {pages.length}
                      </span>
                    </span>
                  }
                >
                  {pages.map((page) => {
                    const NavIcon = page.icon ? ICON_MAP[page.icon] : Settings
                    return (
                      <CommandItem
                        key={page.id}
                        value={`page-${page.id}`}
                        onSelect={() => {
                          onNavigate(page.id)
                          onOpenChange(false)
                        }}
                      >
                        <NavIcon />
                        <span className="flex-1 truncate">{page.label}</span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}

              {!querying ? (
                <ResultGroup
                  heading="Recent prompts"
                  items={recents}
                  renderItem={entityRow("prompts")}
                  onExpand={revealSelection}
                />
              ) : (
                <>
                  <ResultGroup
                    heading="Prompts"
                    items={promptHits}
                    renderItem={entityRow("prompts")}
                    onExpand={revealSelection}
                  />
                  <ResultGroup
                    heading="Categories"
                    items={categoryHits}
                    renderItem={entityRow("categories")}
                    onExpand={revealSelection}
                  />
                  <ResultGroup
                    heading="Tags"
                    items={tagHits}
                    renderItem={entityRow("tags")}
                    onExpand={revealSelection}
                  />
                </>
              )}
            </CommandList>

            {/* Footer hint bar */}
            <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/40 px-3 py-2">
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Key>↑</Key>
                  <Key>↓</Key>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <Key>↵</Key>
                  open
                </span>
                <span className="flex items-center gap-1">
                  <Key>esc</Key>
                  close
                </span>
              </div>
              <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                {loading
                  ? "Searching…"
                  : `${totalResults} result${totalResults === 1 ? "" : "s"}`}
              </span>
            </div>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
