import type { CurrentRegime, DiagnosticsReport, RegimeStats } from '../lib/types'

function pct(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${Math.round(value * 100)}%`
}

function assignmentLabel(probability: number, fallback: boolean, explicit?: string) {
  if (explicit) return explicit
  if (fallback) return 'Hard cluster proxy'
  if (probability >= 0.995) return 'Near one-hot'
  if (probability >= 0.85) return 'Strong assignment'
  if (probability >= 0.6) return 'Probabilistic split'
  return 'Ambiguous posterior'
}

function gammaDetail(value: number) {
  if (value >= 0.995) return 'MAP γₜ is near 1.00'
  return `MAP γₜ = ${value.toFixed(3)}`
}

function safeProbability(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return 0
  return Math.max(0, Math.min(1, value))
}

function regimeKey(regime: number | string | undefined) {
  return regime === undefined ? '' : String(regime)
}

interface RegimeProbabilityStripProps {
  stats?: RegimeStats[]
  currentRegime?: CurrentRegime
  diagnostics?: DiagnosticsReport
}

export default function RegimeProbabilityStrip({
  stats = [],
  currentRegime,
  diagnostics,
}: RegimeProbabilityStripProps) {
  if (!stats.length) return null

  const sortedByLatest = [...stats].sort(
    (a, b) => safeProbability(b.latest_probability) - safeProbability(a.latest_probability),
  )
  const currentState = regimeKey(currentRegime?.state ?? sortedByLatest[0]?.regime)
  const active = stats.find((stat) => regimeKey(stat.regime) === currentState) ?? sortedByLatest[0]
  const activeProbability = safeProbability(
    active?.latest_probability ?? currentRegime?.confidence,
  )
  const nonZeroLatest = stats.filter((stat) => safeProbability(stat.latest_probability) > 0.005).length
  const modelType = String(diagnostics?.model_type ?? '')
  const isFallback = modelType.toLowerCase().includes('kmeans')
  const isNearOneHot = activeProbability >= 0.995 && nonZeroLatest <= 1
  const assignment = assignmentLabel(activeProbability, isFallback, currentRegime?.assignment_type)

  const totalObservations = stats.reduce((sum, stat) => sum + Number(stat.observations ?? 0), 0)
  const historicalShares = [...stats]
    .map((stat) => ({
      ...stat,
      share: totalObservations > 0 ? Number(stat.observations ?? 0) / totalObservations : 0,
    }))
    .sort((a, b) => b.share - a.share)

  return (
    <div className="card p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="label">Latest regime assignment</p>
          <h3 className="mt-2 text-lg font-semibold text-ink">Latest latent-state assignment</h3>
        </div>
        <span className="rounded-full bg-soft px-3 py-1 text-xs font-semibold text-accent">
          {assignment}
        </span>
      </div>

      <div className="mb-5 rounded-2xl border border-line bg-ivory p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-subdued">
              Current latent state
            </p>
            <h4 className="mt-2 text-base font-semibold text-ink">
              State {active?.regime} · {active?.label}
            </h4>
          </div>
          <span className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-ink shadow-sm">
            {isFallback ? 'Cluster' : gammaDetail(activeProbability)}
          </span>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="h-2 overflow-hidden rounded-full bg-[#E8E1D6]">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${Math.max(4, activeProbability * 100)}%` }}
            />
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-subdued">
            State mass, not forecast confidence
          </div>
        </div>
        <p className="mt-3 text-xs leading-5 text-muted">
          {isFallback
            ? 'KMeans fallback provides a cluster assignment, not true posterior probabilities.'
            : isNearOneHot
              ? 'The latest observation is near one-hot. This is a strong latent-state assignment, not directional market certainty.'
              : 'Latest HMM posterior state mass for the most recent observation.'}{' '}
          State names are semantic labels derived from statistics, so several latent states can share the same label.
        </p>
      </div>

      <div>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">Historical regime share</p>
            <p className="mt-1 text-xs text-muted">Share of observations assigned to each latent state.</p>
          </div>
          <span className="text-xs font-medium text-subdued">n={totalObservations.toLocaleString()}</span>
        </div>

        <div className="space-y-3">
          {historicalShares.map((stat) => {
            const isCurrent = regimeKey(stat.regime) === currentState
            return (
              <div key={stat.regime} className={isCurrent ? 'rounded-xl bg-soft/70 p-3' : 'p-3'}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-ink">
                    State {stat.regime} · {stat.label}
                  </span>
                  <span className="font-semibold text-ink">{pct(stat.share)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#EFE9DF]">
                  <div
                    className={`h-full rounded-full ${isCurrent ? 'bg-brand' : 'bg-accent/55'}`}
                    style={{ width: `${Math.max(0, stat.share * 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
