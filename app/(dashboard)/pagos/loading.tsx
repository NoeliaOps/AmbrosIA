export default function PagosLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-28 bg-muted rounded" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-2">
            <div className="h-3 w-24 bg-muted rounded" />
            <div className="h-7 w-28 bg-muted rounded" />
            <div className="h-2.5 w-20 bg-muted rounded" />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-7 w-24 bg-muted rounded-full" />
        ))}
      </div>
      <div className="rounded-md border border-border overflow-hidden">
        <div className="h-10 bg-muted/40 border-b border-border" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-t border-border">
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-44 bg-muted rounded" />
              <div className="h-3 w-32 bg-muted rounded" />
            </div>
            <div className="h-4 w-20 bg-muted rounded" />
            <div className="h-5 w-16 bg-muted rounded-full" />
            <div className="h-7 w-28 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
