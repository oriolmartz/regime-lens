function pct(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${value >= 0 ? '+' : ''}${Math.round(value * 1000) / 10}%`
}

function tone(label = '') {
  const lower = label.toLowerCase()
  if (lower.includes('stress')) return 'bg-rose-500'
  if (lower.includes('expansion')) return 'bg-emerald-500'
  return 'bg-amber-500'
}

export default function TimelineSegments({ segments = [] }) {
  if (!segments.length) return null
  return (
    <div className="card p-6">
      <p className="label">Regime timeline</p>
      <h3 className="mt-2 text-lg font-semibold text-ink">Recent inferred episodes</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">Compressed view of contiguous regime periods, useful for explaining the path rather than just the latest state.</p>
      <div className="mt-5 space-y-3">
        {segments.slice().reverse().map((seg, idx) => (
          <div key={`${seg.start}-${seg.end}-${idx}`} className="rounded-2xl border border-line bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className={`h-3 w-3 rounded-full ${tone(seg.label)}`} />
                <div>
                  <p className="text-sm font-semibold text-ink">{seg.label}</p>
                  <p className="text-xs text-slate-400">{seg.start} → {seg.end}</p>
                </div>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p><strong className="text-ink">{seg.observations}</strong> obs</p>
                <p>Return {pct(seg.segment_return)} · DD {pct(seg.max_drawdown)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
