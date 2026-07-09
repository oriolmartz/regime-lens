function pct(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${Math.round(value * 100)}%`
}

function fmt(value, digits = 3) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return Number(value).toFixed(digits)
}

export default function BenchmarkPanel({ baseline, stability }) {
  if (!baseline) return null
  const suite = Array.isArray(baseline.baseline_suite) ? baseline.baseline_suite : []
  return (
    <div className="card p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="label">Validation layer</p>
          <h3 className="mt-2 text-lg font-semibold text-ink">Baseline suite & stability checks</h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            The HMM is compared against multiple transparent baselines, not just one weak sanity check: rolling volatility, EWMA volatility and drawdown stress.
          </p>
        </div>
        <span className="rounded-full bg-soft px-3 py-1 text-xs font-semibold text-accent">Skeptical review</span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-line bg-ivory p-4">
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-subdued">Primary baseline</p>
          <p className="mt-2 text-lg font-semibold text-ink">{baseline.latest_label || '—'}</p>
        </div>
        <div className="rounded-2xl border border-line bg-ivory p-4">
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-subdued">Suite agreement</p>
          <p className="mt-2 text-lg font-semibold text-ink">{pct(baseline.suite_mean_agreement ?? baseline.stress_agreement)}</p>
          <p className="mt-1 text-xs capitalize text-muted">{(baseline.suite_verdict || baseline.verdict || '—').replace(/_/g, ' ')}</p>
        </div>
        <div className="rounded-2xl border border-line bg-ivory p-4">
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-subdued">Transition stability</p>
          <p className="mt-2 text-lg font-semibold capitalize text-ink">{(stability?.status || '—').replace(/_/g, ' ')}</p>
        </div>
      </div>

      {suite.length > 0 && (
        <div className="mt-5 overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-left text-xs">
            <thead className="bg-ivory text-subdued">
              <tr>
                <th className="px-4 py-3 font-semibold">Baseline</th>
                <th className="px-4 py-3 font-semibold">Agreement</th>
                <th className="px-4 py-3 font-semibold">Verdict</th>
                <th className="px-4 py-3 font-semibold">Latest / threshold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white text-muted">
              {suite.map((row, index) => (
                <tr key={`${row.name}-${index}`}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-ink">{row.name}</div>
                    <div className="mt-1 max-w-md leading-5 text-subdued">{row.description}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink">{pct(row.stress_agreement)}</td>
                  <td className="px-4 py-3 capitalize">{String(row.verdict || '—').replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3">
                    <div>{row.latest_label || '—'}</div>
                    {(row.latest_value !== undefined || row.threshold !== undefined) && (
                      <div className="mt-1 text-subdued">value {fmt(row.latest_value)} · threshold {fmt(row.threshold)}</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-5 rounded-2xl border border-line bg-white p-4">
        <p className="text-xs font-medium leading-5 text-muted">{baseline.interpretation}</p>
        {stability?.frobenius_distance !== null && stability?.frobenius_distance !== undefined && (
          <p className="mt-2 text-xs font-medium text-subdued">Transition drift distance: {Number(stability.frobenius_distance).toFixed(3)}</p>
        )}
      </div>
    </div>
  )
}
