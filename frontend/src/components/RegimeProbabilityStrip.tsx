function pct(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${Math.round(value * 100)}%`
}

export default function RegimeProbabilityStrip({ stats = [] }) {
  const sorted = [...stats].sort((a, b) => b.latest_probability - a.latest_probability)
  return (
    <div className="card p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="label">Posterior probabilities</p>
          <h3 className="mt-2 text-lg font-semibold text-ink">Current state distribution</h3>
        </div>
        <span className="rounded-full bg-soft px-3 py-1 text-xs font-semibold text-accent">Latest observation</span>
      </div>
      <div className="space-y-4">
        {sorted.map((stat) => (
          <div key={stat.regime}>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-ink">{stat.label}</span>
              <span className="font-semibold text-ink">{pct(stat.latest_probability)}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#EFE9DF]">
              <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(2, stat.latest_probability * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
