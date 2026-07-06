export default function ModelCardPanel({ modelCard }) {
  if (!modelCard) return null
  return (
    <div className="card p-6">
      <p className="label">Model card</p>
      <h3 className="mt-2 text-lg font-semibold text-ink">{modelCard.model_name}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{modelCard.intended_use}</p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-line bg-slate-50 p-4">
          <h4 className="mb-2 text-sm font-semibold text-ink">Inputs</h4>
          <div className="flex flex-wrap gap-2">
            {(modelCard.inputs || []).map((item) => (
              <span key={item} className="rounded-lg bg-white px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-line">{item}</span>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-line bg-slate-50 p-4">
          <h4 className="mb-2 text-sm font-semibold text-ink">Guardrails</h4>
          <ul className="space-y-1 text-xs leading-5 text-slate-600">
            {(modelCard.guardrails || []).map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </section>
      </div>

      <div className="mt-4 rounded-2xl border border-line bg-white p-4">
        <h4 className="mb-2 text-sm font-semibold text-ink">Failure modes surfaced</h4>
        <ul className="grid gap-1 text-xs leading-5 text-slate-600 md:grid-cols-2">
          {(modelCard.failure_modes || []).map((item) => <li key={item}>• {item}</li>)}
        </ul>
      </div>
    </div>
  )
}
