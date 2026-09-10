export function EmptyProjects({
  error,
  isDark,
  t,
}: {
  error?: string
  isDark: boolean
  t: Record<string, string>
}) {
  return (
    <div
      className={`project-empty ${isDark ? 'project-empty-dark' : 'project-empty-light'}`}
    >
      <p className="text-lg font-semibold">{error ? t.unavailable : t.empty}</p>
      <p className="project-empty-copy">
        {error ? `${error}. ${t.tokenHelp}` : t.tryAnother}
      </p>
    </div>
  )
}
