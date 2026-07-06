export default function DataQualityPanel({ quality }) {
  if (!quality) return null
  const tone = quality.status === 'strong'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
    : quality.status === 'review'
      ? 'bg-amber-50 text-amber-700 border-amber-100'
      : 'bg-rose-50 text-rose-700 border-rose-100'

  return (
    <div className="card p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="label">Data quality</p>
          <h3 className="mt-2 text-lg font-semibold text-ink">Input audit</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">Checks continuity, cache/source behavior and data sufficiency before interpreting regimes.</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${tone}`}>{quality.status}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4"><span className="text-xs text-slate-400">Source</span><strong className="mt-1 block text-ink">{quality.source}</strong></div>
        <div className="rounded-2xl bg-slate-50 p-4"><span className="text-xs text-slate-400">Observations</span><strong className="mt-1 block text-ink">{quality.observations}</strong></div>
        <div className="rounded-2xl bg-slate-50 p-4"><span className="text-xs text-slate-400">Window</span><strong className="mt-1 block text-ink">{quality.date_start} → {quality.date_end}</strong></div>
        <div className="rounded-2xl bg-slate-50 p-4"><span className="text-xs text-slate-400">Largest gap</span><strong className="mt-1 block text-ink">{quality.largest_gap_days} days</strong></div>
      </div>

      {(quality.notes || []).length > 0 && (
        <ul className="mt-4 space-y-1 rounded-2xl border border-line bg-white p-4 text-xs leading-5 text-slate-500">
          {quality.notes.map((note, idx) => <li key={idx}>• {note}</li>)}
        </ul>
      )}
    </div>
  )
}
