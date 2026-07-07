function pct(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${Math.round(value * 100)}%`
}

export default function DiagnosticsPanel({ diagnostics }) {
  if (!diagnostics) return null
  const statusTone = diagnostics.confidence_status === 'strong'
    ? 'bg-[#EEF5F0] text-positive border-[#CFE0D5]'
    : diagnostics.confidence_status === 'fragile' || diagnostics.confidence_status === 'fallback'
      ? 'bg-[#FBF3E4] text-warning border-[#EAD8B6]'
      : 'bg-soft text-accent border-[#BFD8D3]'

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
        <div className="rounded-2xl bg-ivory p-4"><span className="text-subdued">Model</span><strong className="mt-1 block text-ink">{diagnostics.model_type}</strong></div>
        <div className="rounded-2xl bg-ivory p-4"><span className="text-subdued">Observations</span><strong className="mt-1 block text-ink">{diagnostics.n_observations}</strong></div>
        <div className="rounded-2xl bg-ivory p-4"><span className="text-subdued">Features</span><strong className="mt-1 block text-ink">{diagnostics.n_features}</strong></div>
        <div className="rounded-2xl bg-ivory p-4"><span className="text-subdued">Separability</span><strong className="mt-1 block text-ink">{pct(diagnostics.separability_score)}</strong></div>
      </div>
      <div className="mt-4 rounded-2xl border border-line bg-white p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-subdued">Feature set</p>
        <div className="flex flex-wrap gap-2">
          {(diagnostics.feature_columns || []).map((f) => <span key={f} className="rounded-lg bg-soft px-2.5 py-1 text-xs font-medium text-accent">{f}</span>)}
        </div>
      </div>
      {(diagnostics.notes || []).length > 0 && (
        <ul className="mt-4 space-y-1 text-xs leading-5 text-muted">
          {diagnostics.notes.map((note, idx) => <li key={idx}>• {note}</li>)}
        </ul>
      )}
    </div>
  )
}
