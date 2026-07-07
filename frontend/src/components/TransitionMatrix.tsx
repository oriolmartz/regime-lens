function pct(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${Math.round(value * 100)}%`
}

export default function TransitionMatrix({ matrix, labels = [] }: { matrix?: number[][]; labels?: string[] }) {
  if (!matrix?.length) return null
  return (
    <div className="card p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="label">Markov transitions</p>
          <h3 className="mt-2 text-lg font-semibold text-ink">Regime transition matrix</h3>
        </div>
        <span className="rounded-full bg-soft px-3 py-1 text-xs font-semibold text-accent">P(next | current)</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="border-b border-line pb-3 text-left font-medium text-subdued">Current ↓ / Next →</th>
              {labels.map((label, idx) => (
                <th key={idx} className="border-b border-line px-3 pb-3 text-right font-medium text-muted">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <td className="border-b border-[#EFE9DF] py-3 pr-3 font-medium text-ink">{labels[i]}</td>
                {row.map((value, j) => (
                  <td key={j} className="border-b border-[#EFE9DF] px-3 py-3 text-right">
                    <span
                      className="inline-flex min-w-14 justify-center rounded-lg px-2 py-1 font-semibold text-ink"
                      style={{ background: `rgba(42, 111, 104, ${0.08 + value * 0.30})` }}
                    >
                      {pct(value)}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
