import { useMemo, useState } from 'react'
import { Activity, ArrowRight, GitBranch, Layers, ShieldCheck } from 'lucide-react'
import type { AnalysisResult, LanguageCode, RegimeTracebackPoint } from '../lib/types'
import { translateRegimeLabel } from '../lib/i18n'

function pct(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return `${(Number(value) * 100).toFixed(1)}%`
}

function num(value?: number | null, digits = 3) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return Number(value).toFixed(digits)
}

function money(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function featureName(name: string) {
  const normalized = name.replace(/_/g, ' ')
  return normalized.toLowerCase() === 'rsi' ? 'RSI' : normalized
}

function signalTone(signal?: string) {
  const normalized = String(signal || '').toLowerCase()
  if (normalized.includes('stress') || normalized.includes('negative')) return 'border-rose-200 bg-rose-50 text-rose-800'
  if (normalized.includes('expansion') || normalized.includes('positive')) return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  if (normalized.includes('transition') || normalized.includes('sideways')) return 'border-amber-200 bg-amber-50 text-amber-800'
  return 'border-line bg-ivory text-muted'
}

function pickDefault(points: RegimeTracebackPoint[] = [], current?: RegimeTracebackPoint | null) {
  return current?.date || points[points.length - 1]?.date || ''
}

export default function RegimeTracebackPanel({ result, language = 'en' }: { result: AnalysisResult; language?: LanguageCode }) {
  const points = result.traceback_points || result.traceback?.points || []
  const current = result.current_traceback || result.traceback?.current || points[points.length - 1]
  const [selectedDate, setSelectedDate] = useState(() => pickDefault(points, current))

  const selected = useMemo(() => {
    return points.find((point) => point.date === selectedDate) || current || points[points.length - 1]
  }, [points, selectedDate, current])

  const eventPoints = useMemo(() => {
    const tagged = points.filter((point) => (point.event_tags || []).length > 0)
    return tagged.slice(-10).reverse()
  }, [points])

  if (!selected) {
    return (
      <div className="card p-6">
        <p className="label">Regime Traceback</p>
        <h3 className="mt-2 text-xl font-semibold text-ink">No traceback available</h3>
      </div>
    )
  }

  const stateProbabilities = selected.state_probabilities || []
  const featureEvidence = selected.feature_evidence || []
  const baselineVotes = selected.baseline_votes || []
  const path = selected.inference_path || []
  const agreement = selected.baseline_total ? `${selected.baseline_agreement_count || 0}/${selected.baseline_total}` : '—'

  return (
    <div className="grid gap-6 xl:grid-cols-[.95fr_1.05fr]">
      <section className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="label">Regime Traceback</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Trace the evidence behind the label</h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              Most regime tools label the market. QuantRegimeTracer reconstructs the inference path for a selected date: local feature context, MAP posterior mass, entropy, evidence strength, Markov transition prior, stress-baseline agreement and final interpretation.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-ivory px-4 py-3 text-xs text-muted">
            <div className="font-semibold text-ink">Selected date</div>
            <select className="mt-2 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink" value={selected.date} onChange={(event) => setSelectedDate(event.target.value)}>
              {points.map((point) => (
                <option key={point.date} value={point.date}>{point.date} · S{point.assigned_state}</option>
              ))}
            </select>
          </div>
        </div>

        {eventPoints.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {eventPoints.map((point) => (
              <button key={`${point.date}-${point.event_tags?.join('-')}`} onClick={() => setSelectedDate(point.date)} className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${point.date === selected.date ? 'border-brand bg-brand text-white' : 'border-line bg-white text-muted hover:border-[#BFD8D3] hover:text-brand'}`}>
                {point.event_tags?.[0]?.replace(/_/g, ' ') || 'event'} · {point.date}
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <TraceMetric label="Assigned regime" value={translateRegimeLabel(selected.semantic_label, language)} detail={`State ${selected.assigned_state}`} />
          <TraceMetric label="Evidence strength" value={pct(selected.evidence_strength)} detail="Traceability score for this point" />
          <TraceMetric label="Assignment type" value={selected.assignment_type || 'State assignment'} detail={`MAP γₜ = ${pct(selected.posterior_confidence)}`} />
          <TraceMetric label="Posterior entropy H(γ)" value={pct(selected.posterior_entropy)} detail="Uncertainty at this date" />
          <TraceMetric label="Transition prior" value={pct(selected.transition_prior)} detail={selected.previous_label ? `${selected.previous_label} → ${selected.semantic_label}` : 'Initial observation'} />
          <TraceMetric label="Stress baseline agreement" value={agreement} detail="Stress/non-stress volatility and drawdown checks" />
        </div>

        <div className="mt-6 rounded-2xl border border-line bg-ivory p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink"><GitBranch size={16} /> Inference path</div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
            {path.map((step, index) => (
              <span key={step} className="inline-flex items-center gap-2">
                <span className="rounded-full border border-line bg-white px-3 py-1">{step}</span>
                {index < path.length - 1 && <ArrowRight size={13} className="text-subdued" />}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-[#BFD8D3]/70 bg-[#F4FBF9] p-4 text-sm leading-6 text-muted">
          <div className="mb-2 flex items-center gap-2 font-semibold text-ink"><ShieldCheck size={16} /> Interpretation</div>
          {selected.interpretation || 'No interpretation available for this point.'}
        </div>
      </section>

      <section className="space-y-6">
        <div className="card p-6">
          <p className="label">Local feature context</p>
          <h3 className="mt-2 text-lg font-semibold text-ink">Signals that support or challenge this assignment</h3>
          <p className="mt-2 text-xs leading-5 text-muted">These are local diagnostics. The HMM assignment also depends on the full standardized feature vector and the surrounding sequence.</p>
          <div className="mt-5 space-y-3">
            {featureEvidence.map((item) => (
              <div key={item.feature} className="rounded-2xl border border-line bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold capitalize text-ink">{featureName(item.feature)}</div>
                    <div className="mt-1 text-xs leading-5 text-muted">{item.rationale}</div>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${signalTone(item.signal)}`}>{item.signal || 'context'}</span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-ivory px-3 py-2 text-xs text-muted">Value <strong className="ml-1 text-ink">{num(item.value, item.feature === 'rsi' ? 1 : 4)}</strong></div>
                  <div className="rounded-xl bg-ivory px-3 py-2 text-xs text-muted">Within-window percentile <strong className="ml-1 text-ink">{pct(item.percentile)}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <div className="mb-4 flex items-center gap-2"><Activity size={16} className="text-brand" /><p className="label">Posterior state mass</p></div>
            <p className="mb-4 text-xs leading-5 text-muted">This distribution explains latent-state assignment strength. It is not a probability of future market direction.</p>
            <div className="space-y-3">
              {stateProbabilities.map((item) => (
                <div key={item.state}>
                  <div className="mb-1 flex items-center justify-between text-xs font-semibold text-muted"><span>State {item.state}</span><span>{pct(item.probability)}</span></div>
                  <div className="h-2 rounded-full bg-ivory"><div className="h-2 rounded-full bg-brand" style={{ width: `${Math.max(0, Math.min(100, item.probability * 100))}%` }} /></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <div className="mb-4 flex items-center gap-2"><Layers size={16} className="text-brand" /><p className="label">Baseline cross-check</p></div>
            <div className="space-y-3">
              {baselineVotes.map((vote) => (
                <div key={vote.name} className="rounded-xl border border-line bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-ink">{vote.name}</div>
                      <div className="mt-1 text-xs leading-5 text-muted">{vote.rule}</div>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${vote.agrees_with_hmm_stress ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {vote.agrees_with_hmm_stress ? 'agrees' : 'diverges'}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-subdued">Value {num(vote.latest_value, 4)} · threshold {num(vote.threshold, 4)} · stress vote {vote.stress_vote ? 'yes' : 'no'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function TraceMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-subdued">{label}</div>
      <div className="mt-2 text-lg font-semibold text-ink">{value}</div>
      <div className="mt-1 text-xs text-muted">{detail}</div>
    </div>
  )
}
