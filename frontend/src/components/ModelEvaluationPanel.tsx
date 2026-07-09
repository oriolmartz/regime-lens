import type { AnalysisResult } from '../lib/types'

function fmt(value: unknown, digits = 2) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return value.toFixed(digits)
}

function pct(value: unknown) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return `${Math.round(value * 100)}%`
}

function label(value: unknown) {
  return typeof value === 'string' && value ? value.replace(/_/g, ' ') : '—'
}

export default function ModelEvaluationPanel({ result }: { result?: AnalysisResult | null }) {
  const evaluation = (result?.model_evaluation || {}) as Record<string, any>
  const candidates = Array.isArray(evaluation.candidates) ? evaluation.candidates : []
  const stability = (evaluation.assignment_stability || {}) as Record<string, any>
  const status = String(evaluation.status || 'unavailable')
  const ok = status === 'ok'
  const recommended = evaluation.recommended_n_regimes ?? evaluation.best_bic_regimes ?? '—'
  const selected = evaluation.selected_regimes ?? '—'
  const matchesRecommendation = evaluation.selected_matches_recommendation

  return (
    <div className="card p-6">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="label">Model evaluation</p>
          <h3 className="mt-2 text-lg font-semibold text-ink">Temporal HMM holdout & robustness diagnostics</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Candidate HMMs are scored on a chronological train/test split. The panel then recommends a regime count with BIC and refits the selected HMM across random seeds to test assignment stability.
          </p>
        </div>
        <div className={`rounded-2xl border px-4 py-3 text-xs leading-5 ${ok ? 'border-[#BFD8C7] bg-[#EEF5F0] text-positive' : 'border-[#EACF9D] bg-[#FBF3E4] text-warning'}`}>
          <strong>Status:</strong> {label(status)}<br />
          <strong>Selected:</strong> {selected} regimes<br />
          <strong>Recommended:</strong> {recommended} regimes
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Metric title="Recommended k" value={String(recommended)} detail={String(evaluation.recommendation_basis || 'BIC primary')} emphasis={matchesRecommendation === false ? 'review' : 'ok'} />
        <Metric title="Train obs" value={String(evaluation.train_observations ?? '—')} detail="chronological first split" />
        <Metric title="Test obs" value={String(evaluation.test_observations ?? '—')} detail="held-out later window" />
        <Metric title="LL gap" value={fmt(evaluation.selected_train_test_loglik_gap, 3)} detail="train minus test per observation" />
        <Metric title="Seed stability" value={label(stability.verdict || stability.status)} detail={`ARI ${fmt(stability.mean_adjusted_rand_index, 2)} · min ${fmt(stability.min_adjusted_rand_index, 2)}`} emphasis={stability.verdict === 'unstable' ? 'review' : 'ok'} />
      </div>

      {evaluation.recommendation_reason && (
        <div className="mt-5 rounded-2xl border border-line bg-ivory p-4 text-sm leading-6 text-muted">
          <strong className="text-ink">Regime-count recommendation:</strong> {String(evaluation.recommendation_reason)}
          {matchesRecommendation === false && (
            <div className="mt-2 text-warning">Selected k differs from the BIC recommendation; this is surfaced deliberately instead of hiding model-selection ambiguity.</div>
          )}
        </div>
      )}

      {candidates.length > 0 ? (
        <div className="mt-5 overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-left text-xs">
            <thead className="bg-ivory text-subdued">
              <tr>
                <th className="px-4 py-3 font-semibold">Regimes</th>
                <th className="px-4 py-3 font-semibold">Train LL/obs</th>
                <th className="px-4 py-3 font-semibold">Test LL/obs</th>
                <th className="px-4 py-3 font-semibold">AIC</th>
                <th className="px-4 py-3 font-semibold">BIC</th>
                <th className="px-4 py-3 font-semibold">Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white text-muted">
              {candidates.map((row: Record<string, unknown>) => {
                const isRecommended = Number(row.n_regimes) === Number(recommended)
                const isSelected = Number(row.n_regimes) === Number(selected)
                return (
                  <tr key={String(row.n_regimes)} className={isRecommended ? 'bg-[#F6FBF8]' : undefined}>
                    <td className="px-4 py-3 font-semibold text-ink">{String(row.n_regimes)}</td>
                    <td className="px-4 py-3">{fmt(row.train_log_likelihood_per_obs)}</td>
                    <td className="px-4 py-3">{fmt(row.test_log_likelihood_per_obs)}</td>
                    <td className="px-4 py-3">{fmt(row.aic, 0)}</td>
                    <td className="px-4 py-3">{fmt(row.bic, 0)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {isRecommended && <span className="rounded-full bg-soft px-2 py-1 text-[10px] font-semibold text-brand">recommended</span>}
                        {isSelected && <span className="rounded-full bg-ivory px-2 py-1 text-[10px] font-semibold text-ink">selected</span>}
                        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-subdued">{row.converged ? 'converged' : 'review'}</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-line bg-ivory p-4 text-sm leading-6 text-muted">
          {String(evaluation.message || 'GaussianHMM holdout diagnostics are not available in this runtime. Install backend requirements to enable them.')}
        </div>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <Info title="BIC recommendation" body="Penalizes extra states, so the selected regime count is not just a free UI knob." />
        <Info title="Held-out likelihood" body="Scores the later time window chronologically, exposing overfit risk without claiming PnL validity." />
        <Info title="Multi-seed ARI" body="Adjusted Rand Index compares assignments across HMM initializations and is invariant to label switching." />
      </div>

      {stability.message && (
        <p className="mt-4 text-xs leading-5 text-muted">
          <strong>Assignment stability:</strong> {String(stability.message)} {stability.mean_adjusted_rand_index !== undefined ? `Mean ARI ${fmt(stability.mean_adjusted_rand_index, 3)} (${pct(stability.mean_adjusted_rand_index)} agreement-like stability).` : ''}
        </p>
      )}
    </div>
  )
}

function Metric({ title, value, detail, emphasis }: { title: string; value: string; detail: string; emphasis?: 'ok' | 'review' }) {
  const tone = emphasis === 'review' ? 'border-[#EACF9D] bg-[#FBF3E4]' : emphasis === 'ok' ? 'border-[#BFD8C7] bg-[#EEF5F0]' : 'border-line bg-white'
  return (
    <div className={`rounded-2xl border p-4 ${tone}`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-subdued">{title}</div>
      <div className="mt-2 text-xl font-semibold text-ink">{value}</div>
      <div className="mt-1 text-xs text-muted">{detail}</div>
    </div>
  )
}

function Info({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="text-sm font-semibold text-ink">{title}</div>
      <div className="mt-2 text-xs leading-5 text-muted">{body}</div>
    </div>
  )
}
