import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDate, getContentStats, truncate } from "@/lib/utils";
import type { PromptRow } from "@/types";

interface PromptCardProps {
  prompt: PromptRow;
  onSelect: (prompt: PromptRow) => void;
  onEdit: (prompt: PromptRow) => void;
  onDelete: (id: number) => void;
  onToggleFavorite?: (id: number) => void;
}

export function PromptCard({ prompt, onSelect, onEdit, onDelete, onToggleFavorite }: PromptCardProps) {
  const stats = getContentStats(prompt.content);
  return (
    <Card
      className="cursor-pointer border-0 shadow-sm transition-all hover:shadow-md hover:border-primary/30 group"
      onClick={() => onSelect(prompt)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
            {prompt.title}
          </CardTitle>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onToggleFavorite && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(prompt.id); }}
                className={`flex h-7 w-7 items-center justify-center rounded-md ${prompt.is_favorite ? 'text-yellow-500' : 'hover:bg-muted'}`}
                title={prompt.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <svg className="h-3.5 w-3.5" fill={prompt.is_favorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(prompt); }}
              className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted"
              title="Edit"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(prompt.id); }}
              className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-destructive/10 hover:text-destructive"
              title="Delete"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </div>
        </div>
        {prompt.category && (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {prompt.category}
          </span>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {truncate(prompt.description || prompt.content, 120)}
        </p>
        {prompt.tags && (
          <div className="mt-3 flex flex-wrap gap-1">
            {prompt.tags.split(",").map((tag, i) => (
              <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {tag.trim()}
              </span>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">{formatDate(prompt.updated_at)}</p>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground/80">
          <span>~{stats.tokens} tokens</span>
          <span>{stats.words} words</span>
          <span>{stats.sentences} sentences</span>
          <span>{stats.paragraphs} paragraphs</span>
        </div>
      </CardContent>
    </Card>
  );
}
