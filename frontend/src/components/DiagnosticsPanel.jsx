function pct(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${Math.round(value * 100)}%`
}

export default function DiagnosticsPanel({ diagnostics }) {
  if (!diagnostics) return null
  const statusTone = diagnostics.confidence_status === 'strong'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
    : diagnostics.confidence_status === 'fragile' || diagnostics.confidence_status === 'fallback'
      ? 'bg-amber-50 text-amber-700 border-amber-100'
      : 'bg-blue-50 text-blue-700 border-blue-100'

  return (
    <div className="card p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="label">Model diagnostics</p>
          <h3 className="mt-2 text-lg font-semibold text-ink">Analysis audit trail</h3>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusTone}`}>{diagnostics.confidence_status}</span>
      </div>
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4"><span className="text-slate-400">Model</span><strong className="mt-1 block text-ink">{diagnostics.model_type}</strong></div>
        <div className="rounded-2xl bg-slate-50 p-4"><span className="text-slate-400">Observations</span><strong className="mt-1 block text-ink">{diagnostics.n_observations}</strong></div>
        <div className="rounded-2xl bg-slate-50 p-4"><span className="text-slate-400">Features</span><strong className="mt-1 block text-ink">{diagnostics.n_features}</strong></div>
        <div className="rounded-2xl bg-slate-50 p-4"><span className="text-slate-400">Separability</span><strong className="mt-1 block text-ink">{pct(diagnostics.separability_score)}</strong></div>
      </div>
      <div className="mt-4 rounded-2xl border border-line bg-white p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Feature set</p>
        <div className="flex flex-wrap gap-2">
          {(diagnostics.feature_columns || []).map((f) => <span key={f} className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-brand">{f}</span>)}
        </div>
      </div>
      {(diagnostics.notes || []).length > 0 && (
        <ul className="mt-4 space-y-1 text-xs leading-5 text-slate-500">
          {diagnostics.notes.map((note, idx) => <li key={idx}>• {note}</li>)}
        </ul>
      )}
    </div>
  )
}
