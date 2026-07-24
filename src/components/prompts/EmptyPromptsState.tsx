interface EmptyPromptsStateProps {
  onLoadDemo?: () => void;
}

export function EmptyPromptsState({ onLoadDemo }: EmptyPromptsStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-5">
        <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
      <h3 className="text-headline">No prompts yet</h3>
      <p className="mt-1.5 text-body text-muted-foreground max-w-sm">Create your first prompt or load demo prompts to get started.</p>
      {onLoadDemo && (
        <div className="mt-5">
          <button
            onClick={onLoadDemo}
            className="inline-flex items-center gap-2 rounded-[10px] bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/80 transition-colors duration-150"
          >
            Load demo prompts
          </button>
        </div>
      )}
    </div>
  );
}
