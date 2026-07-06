function pct(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${Math.round(value * 100)}%`
}

export default function TransitionMatrix({ matrix, labels }) {
  if (!matrix?.length) return null
  return (
    <div className="card p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="label">Markov transitions</p>
          <h3 className="mt-2 text-lg font-semibold text-ink">Regime transition matrix</h3>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-brand">P(next | current)</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="border-b border-line pb-3 text-left font-medium text-slate-400">Current ↓ / Next →</th>
              {labels.map((label, idx) => (
                <th key={idx} className="border-b border-line px-3 pb-3 text-right font-medium text-slate-500">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <td className="border-b border-slate-100 py-3 pr-3 font-medium text-slate-700">{labels[i]}</td>
                {row.map((value, j) => (
                  <td key={j} className="border-b border-slate-100 px-3 py-3 text-right">
                    <span
                      className="inline-flex min-w-14 justify-center rounded-lg px-2 py-1 font-semibold text-ink"
                      style={{ background: `rgba(37, 99, 235, ${0.07 + value * 0.28})` }}
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
