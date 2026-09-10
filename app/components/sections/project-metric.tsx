export function Metric({
  isDark,
  label,
  value,
}: {
  isDark: boolean
  label: string
  value: string
}) {
  return (
    <div
      className={`project-metric ${isDark ? 'project-metric-dark' : 'project-metric-light'}`}
    >
      <p className="project-metric-label">{label}</p>
      <p className="project-metric-value">{value}</p>
    </div>
  )
}
