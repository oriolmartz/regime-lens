import { translateRegimeLabel } from '../lib/i18n'
import type { AnalysisResult, LanguageCode, RegimePoint, RegimeStats } from '../lib/types'

function pct(value?: number | null, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${(value * 100).toFixed(digits)}%`
}

function num(value?: number | null, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return Number(value).toFixed(digits)
}

function latestPoint(points?: RegimePoint[]) {
  return points?.length ? points[points.length - 1] : undefined
}

function currentStateNumber(result: AnalysisResult) {
  const raw = result.current_regime?.state
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : 0
}

function transitionUncertainty(result: AnalysisResult) {
  const state = currentStateNumber(result)
  const row = result.transition_matrix?.[state]
  if (!row?.length) return null
  const clean = row.map((v) => Math.max(0, Number(v) || 0))
  const total = clean.reduce((a, b) => a + b, 0)
  if (total <= 0 || clean.length <= 1) return null
  const probs = clean.map((v) => v / total).filter((v) => v > 0)
  const entropy = -probs.reduce((sum, p) => sum + p * Math.log(p), 0)
  return entropy / Math.log(clean.length)
}

function averageDuration(result: AnalysisResult) {
  const segments = result.regime_segments || []
  if (!segments.length) return null
  const avg = segments.reduce((sum, seg) => sum + Number(seg.observations || 0), 0) / segments.length
  return avg
}

function currentStats(result: AnalysisResult) {
  const state = currentStateNumber(result)
  return result.regime_stats?.find((stat) => Number(stat.regime) === state)
}

function toneFor(value: number | null, redAt = 0.66, amberAt = 0.38) {
  if (value === null) return 'neutral'
  if (value >= redAt) return 'red'
  if (value >= amberAt) return 'amber'
  return 'green'
}

function assignmentTone(label?: string) {
  const text = String(label || '').toLowerCase()
  if (text.includes('ambiguous')) return 'amber'
  if (text.includes('probabilistic')) return 'blue'
  if (text.includes('near') || text.includes('strong')) return 'green'
  if (text.includes('cluster')) return 'amber'
  return 'neutral'
}

export default function RegimeSummaryMetrics({ result, language = 'en' }: { result: AnalysisResult; language?: LanguageCode }) {
  const latest = latestPoint(result.time_series)
  const stats = currentStats(result)
  const uncertainty = transitionUncertainty(result)
  const avgDuration = averageDuration(result)
  const persistence = result.current_regime.expected_persistence_days
  const vol = typeof latest?.rolling_volatility === 'number' ? latest.rolling_volatility : stats?.annualized_volatility
  const momentum = typeof latest?.momentum_20 === 'number' ? latest.momentum_20 : stats?.mean_momentum as number | undefined
  const drawdown = typeof latest?.drawdown === 'number' ? latest.drawdown : stats?.mean_drawdown
  const evidenceStrength = typeof result.current_regime.evidence_strength === 'number' ? result.current_regime.evidence_strength : null
  const assignmentStrength = typeof result.current_regime.assignment_strength === 'number'
    ? result.current_regime.assignment_strength
    : result.current_regime.confidence
  const assignmentType = String(result.current_regime.assignment_type || 'State assignment')

  const items = [
    {
      label: 'Current regime',
      value: translateRegimeLabel(result.current_regime.label, language),
      detail: `State ${result.current_regime.state ?? '—'} · semantic label`,
      tone: result.current_regime.label?.toLowerCase().includes('stress') ? 'red' : result.current_regime.label?.toLowerCase().includes('transition') ? 'amber' : 'green',
    },
    {
      label: 'Evidence strength',
      value: pct(evidenceStrength),
      detail: 'Composite of assignment sharpness, baselines, stability, k-selection and data quality',
      tone: toneFor(1 - (evidenceStrength ?? 0), 0.45, 0.25),
    },
    {
      label: 'Assignment type',
      value: assignmentType,
      detail: `MAP γₜ = ${pct(assignmentStrength, 1)} · state assignment, not market certainty`,
      tone: assignmentTone(assignmentType),
    },
    {
      label: 'Posterior entropy',
      value: pct(result.current_regime.posterior_entropy, 1),
      detail: 'H(γₜ): near 0 means one latent state dominates',
      tone: toneFor(result.current_regime.posterior_entropy ?? null, 0.35, 0.12),
    },
    {
      label: 'Avg regime duration',
      value: avgDuration === null ? '—' : `${num(avgDuration, 0)} obs`,
      detail: 'Mean contiguous state segment length',
      tone: 'blue',
    },
    {
      label: 'State persistence',
      value: persistence ? `${num(persistence, 1)} obs` : pct(result.current_regime.stay_probability),
      detail: 'Markov 1/(1 − Pᵢᵢ) from stay probability',
      tone: 'blue',
    },
    {
      label: 'Transition uncertainty',
      value: pct(uncertainty, 0),
      detail: 'Normalized entropy H(Pᵢ·) of current transition row',
      tone: toneFor(uncertainty, 0.66, 0.38),
    },
    {
      label: 'Baseline agreement',
      value: pct(result.baseline?.stress_agreement),
      detail: 'Agreement with transparent volatility/drawdown rules',
      tone: toneFor(1 - Number(result.baseline?.stress_agreement ?? 0.5), 0.45, 0.25),
    },
    {
      label: 'Volatility score',
      value: pct(vol, 1),
      detail: 'Rolling annualized σ feeding regime inference',
      tone: toneFor(vol ?? null, 0.42, 0.22),
    },
    {
      label: 'Trend strength',
      value: pct(momentum, 1),
      detail: '20-day momentum / drift proxy feature',
      tone: typeof momentum === 'number' && momentum >= 0 ? 'green' : 'amber',
    },
    {
      label: 'Drawdown stress',
      value: pct(Math.abs(drawdown ?? 0), 1),
      detail: 'Peak-to-trough pressure in current window',
      tone: toneFor(Math.abs(drawdown ?? 0), 0.22, 0.1),
    },
  ] as const

  return (
    <div className="card p-6">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="label">Regime summary metrics</p>
          <h3 className="mt-2 text-lg font-semibold text-ink">Readable metrics with quantitative traceability</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Each surface metric is backed by a technical diagnostic: posterior γ, entropy H(γ), Markov persistence,
            baseline agreement, multi-seed stability, model-selection alignment and data-quality checks.
          </p>
        </div>
        <span className="rounded-full bg-soft px-3 py-1 text-xs font-semibold text-accent">Auditable inference view</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <MetricTile key={item.label} {...item} />
        ))}
      </div>
    </div>
  )
}

function MetricTile({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) {
  const toneClass: Record<string, string> = {
    neutral: 'bg-ivory text-ink border-line',
    blue: 'bg-soft text-accent border-[#BFD8D3]',
    amber: 'bg-[#FBF3E4] text-warning border-[#EACF9D]',
    red: 'bg-[#F7EEEE] text-danger border-[#E7C1C1]',
    green: 'bg-[#EEF5F0] text-positive border-[#BFD8C7]',
  }
  return (
    <div className={`rounded-2xl border p-4 ${toneClass[tone] || toneClass.neutral}`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-75">{label}</div>
      <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-3 rounded-xl bg-white/65 px-3 py-2 text-xs leading-5 text-muted">{detail}</div>
    </div>
  )
}
