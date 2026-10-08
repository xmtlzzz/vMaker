export function EmptyProjects({
  error,
  isDark,
  t,
  onClear,
}: {
  error?: string
  isDark: boolean
  t: Record<string, string>
  onClear?: () => void
}) {
  return (
    <div
      className={`project-empty ${isDark ? 'project-empty-dark' : 'project-empty-light'}`}
    >
      <p className="text-lg font-semibold">{error ? t.unavailable : t.empty}</p>
      <p className="project-empty-copy">
        {error ? `${error}. ${t.tokenHelp}` : t.tryAnother}
      </p>
      {!error && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-current/20 px-3.5 py-1.5 text-xs font-medium opacity-85 transition-opacity hover:opacity-100"
        >
          {t.clearFilters || '清除搜索与筛选'}
        </button>
      )}
    </div>
  )
}
