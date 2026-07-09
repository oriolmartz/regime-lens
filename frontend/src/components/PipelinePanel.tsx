import { BarChart3, BrainCircuit, Database, FileText, GitBranch, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AnalysisResult, LanguageCode } from '../lib/types'

function pct(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${Math.round(value * 100)}%`
}

const copy = {
  en: {
    kicker: 'System pipeline',
    title: 'From raw prices to reviewable risk intelligence',
    body: 'The app is intentionally built as a transparent analysis pipeline: every output shown in the memo can be traced back to data quality, engineered features, inferred regimes, transition probabilities and validation checks.',
    steps: [
      ['Data ingest', 'Real provider data, local cache, uploaded CSV or explicit offline sample with date/close validation.'],
      ['Feature layer', 'Log returns, rolling volatility, drawdown, moving-average distance, momentum, RSI and optional volume change.'],
      ['Regime engine', 'Gaussian HMM when available; deterministic KMeans fallback is explicitly flagged.'],
      ['Markov transitions', 'Empirical transition matrix, stay probability and stress-transition probability.'],
      ['Validation', 'Volatility baseline, transition stability and data-quality diagnostics.'],
      ['Executive memo', 'Guarded Markdown/JSON output with no buy/sell instructions.'],
    ],
    model: 'Model',
    observations: 'Observations',
    features: 'Features',
    baseline: 'Baseline agreement',
  },
  es: {
    kicker: 'Pipeline del sistema',
    title: 'De precios crudos a inteligencia de riesgo revisable',
    body: 'La app está construida como un pipeline transparente: cada salida del memo puede trazarse a calidad de datos, features, regímenes inferidos, probabilidades de transición y checks de validación.',
    steps: [
      ['Ingesta de datos', 'Datos reales de proveedor, caché local, CSV subido o muestra offline explícita con validación date/close.'],
      ['Capa de features', 'Log returns, volatilidad rolling, drawdown, distancia a media móvil, momentum, RSI y volumen opcional.'],
      ['Motor de regímenes', 'Gaussian HMM si está disponible; fallback KMeans determinista siempre queda marcado explícitamente.'],
      ['Transiciones Markov', 'Matriz empírica de transición, permanencia y probabilidad de pasar a estrés.'],
      ['Validación', 'Baseline de volatilidad, estabilidad de transición y diagnóstico de calidad de datos.'],
      ['Memo ejecutivo', 'Salida Markdown/JSON con guardrails y sin instrucciones de compra/venta.'],
    ],
    model: 'Modelo',
    observations: 'Observaciones',
    features: 'Features',
    baseline: 'Acuerdo baseline',
  },
}

const icons: LucideIcon[] = [Database, BarChart3, BrainCircuit, GitBranch, ShieldCheck, FileText]

export default function PipelinePanel({ result, language = 'en' }: { result?: AnalysisResult | null; language?: LanguageCode }) {
  const c = copy[language] || copy.en
  const facts = [
    { label: c.model, value: result?.diagnostics?.model_type || '—' },
    { label: c.observations, value: result?.diagnostics?.n_observations?.toLocaleString?.() || result?.data_quality?.observations?.toLocaleString?.() || '—' },
    { label: c.features, value: result?.diagnostics?.n_features?.toString?.() || '—' },
    { label: c.baseline, value: pct(result?.baseline?.stress_agreement) },
  ]

  return (
    <div className="card overflow-hidden">
      <div className="grid gap-0 xl:grid-cols-[.9fr_1.1fr]">
        <div className="border-b border-line bg-ivory p-6 xl:border-b-0 xl:border-r">
          <p className="label">{c.kicker}</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-ink">{c.title}</h3>
          <p className="mt-3 text-sm leading-6 text-muted">{c.body}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {facts.map((fact) => (
              <div key={fact.label} className="rounded-2xl border border-line bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-subdued">{fact.label}</p>
                <p className="mt-2 text-sm font-semibold text-ink">{fact.value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-3 p-6 md:grid-cols-2 xl:grid-cols-3">
          {c.steps.map(([title, body], idx) => {
            const Icon = icons[idx]
            return (
              <div key={title} className="relative rounded-2xl border border-line bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-soft text-accent"><Icon size={17} /></div>
                  <span className="rounded-full bg-ivory px-2 py-1 text-[11px] font-semibold text-subdued">0{idx + 1}</span>
                </div>
                <h4 className="text-sm font-semibold text-ink">{title}</h4>
                <p className="mt-2 text-xs leading-5 text-muted">{body}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
