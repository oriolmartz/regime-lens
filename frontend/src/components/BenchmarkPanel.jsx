function pct(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${Math.round(value * 100)}%`
}

export default function BenchmarkPanel({ baseline, stability }) {
  if (!baseline) return null
  return (
    <div className="card p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="label">Validation layer</p>
          <h3 className="mt-2 text-lg font-semibold text-ink">Baseline & stability checks</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">A transparent sanity check compares the HMM regime path against a simple volatility-only baseline.</p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-brand">V4</span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-line bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-slate-400">Baseline label</p>
          <p className="mt-2 text-lg font-semibold text-ink">{baseline.latest_label || '—'}</p>
        </div>
        <div className="rounded-2xl border border-line bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-slate-400">Stress agreement</p>
          <p className="mt-2 text-lg font-semibold text-ink">{pct(baseline.stress_agreement)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-slate-400">Transition stability</p>
          <p className="mt-2 text-lg font-semibold capitalize text-ink">{(stability?.status || '—').replaceAll('_', ' ')}</p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-line bg-white p-4">
        <p className="text-xs font-medium leading-5 text-slate-500">{baseline.interpretation}</p>
        {stability?.frobenius_distance !== null && stability?.frobenius_distance !== undefined && (
          <p className="mt-2 text-xs font-medium text-slate-400">Transition drift distance: {Number(stability.frobenius_distance).toFixed(3)}</p>
        )}
      </div>
    </div>
  )
}
