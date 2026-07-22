import { formatDate, getContentStats, truncate } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { PromptRow } from "@/types";

interface PromptListItemProps {
  prompt: PromptRow;
  onSelect: (prompt: PromptRow) => void;
  onEdit: (prompt: PromptRow) => void;
  onDelete: (id: number) => void;
  onToggleFavorite?: (id: number) => void;
}

export function PromptListItem({ prompt, onSelect, onEdit, onDelete, onToggleFavorite }: PromptListItemProps) {
  const stats = getContentStats(prompt.content);
  return (
    <div
      className="group grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={() => onSelect(prompt)}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 shrink-0">
          <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium truncate">{prompt.title}</p>
            {prompt.is_favorite && (
              <svg className="h-3.5 w-3.5 text-yellow-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {truncate(prompt.description || prompt.content, 60)}
          </p>
        </div>
      </div>
      <div className="w-32 flex items-center justify-center gap-2">
        {prompt.category && (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {prompt.category}
          </span>
        )}
        {onToggleFavorite && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(prompt.id); }}
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-all ${prompt.is_favorite ? 'text-yellow-500' : 'opacity-0 group-hover:opacity-100 hover:bg-muted'}`}
            title={prompt.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <svg className="h-3.5 w-3.5" fill={prompt.is_favorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(prompt); }}
          className="flex h-7 w-7 items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
          title="Edit"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(prompt.id); }}
          className="flex h-7 w-7 items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
          title="Delete"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="w-40 flex items-center justify-center cursor-default">
            <div className="flex flex-col items-center text-xs text-muted-foreground leading-tight">
              <span className="font-medium text-foreground">
                ~{stats.tokens} tokens
              </span>
              <span>{stats.words}w · {stats.sentences}s · {stats.paragraphs}p</span>
            </div>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span>~{stats.tokens} tokens</span>
            <span>{stats.words} Words</span>
            <span>{stats.sentences} Sentences</span>
            <span>{stats.paragraphs} Paragraphs</span>
          </div>
        </TooltipContent>
      </Tooltip>
      <span className="w-24 text-right text-xs text-muted-foreground">
        {formatDate(prompt.updated_at)}
      </span>
    </div>
  );
}
