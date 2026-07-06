function pct(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${Math.round(value * 100)}%`
}

export default function BaselineComparisonPanel({ baseline }) {
  if (!baseline) return null
  return (
    <div className="card p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="label">HMM vs baseline</p>
          <h3 className="mt-2 text-lg font-semibold text-ink">Where the probabilistic model agrees or diverges</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">V4 surfaces disagreement explicitly so the HMM is not treated as magic.</p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-brand">{baseline.verdict || 'review'}</span>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-line bg-slate-50 p-4"><span className="text-xs text-slate-400">Stress agreement</span><strong className="mt-1 block text-lg text-ink">{pct(baseline.stress_agreement)}</strong></div>
        <div className="rounded-2xl border border-line bg-slate-50 p-4"><span className="text-xs text-slate-400">Disagreement rate</span><strong className="mt-1 block text-lg text-ink">{pct(baseline.disagreement_rate)}</strong></div>
        <div className="rounded-2xl border border-line bg-slate-50 p-4"><span className="text-xs text-slate-400">Latest baseline</span><strong className="mt-1 block text-lg text-ink">{baseline.latest_label}</strong></div>
      </div>
      {(baseline.disagreement_segments || []).length > 0 && (
        <div className="mt-5 rounded-2xl border border-line bg-white p-4">
          <h4 className="mb-3 text-sm font-semibold text-ink">Recent disagreement windows</h4>
          <div className="space-y-2 text-xs text-slate-500">
            {baseline.disagreement_segments.map((seg, idx) => (
              <div key={idx} className="flex flex-wrap justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
                <span>{seg.start} → {seg.end}</span>
                <span>{seg.observations} obs · HMM stress {pct(seg.hmm_stress_share)} · baseline stress {pct(seg.baseline_stress_share)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
