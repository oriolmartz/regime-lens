import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, FileText, Layers, ShieldCheck } from 'lucide-react'

const labelMap = {
  en: {
    kicker: 'LangGraph memo',
    compact: 'Compact review',
    summary: 'Summary',
    evidence: 'Evidence',
    review: 'Review',
    limits: 'Limits',
    current: 'Current regime',
    dataQuality: 'Data quality',
    transitionRisk: 'Transition risk',
    validation: 'Validation checks',
    considerations: 'Review considerations',
    limitations: 'Limitations',
    guardrails: 'Guardrails',
    showAll: 'Show all',
    noMemo: 'No memo available yet.',
  },
  es: {
    kicker: 'Memo LangGraph',
    compact: 'Revisión compacta',
    summary: 'Resumen',
    evidence: 'Evidencia',
    review: 'Revisión',
    limits: 'Límites',
    current: 'Régimen actual',
    dataQuality: 'Calidad de datos',
    transitionRisk: 'Riesgo de transición',
    validation: 'Checks de validación',
    considerations: 'Consideraciones de revisión',
    limitations: 'Limitaciones',
    guardrails: 'Guardrails',
    showAll: 'Ver todo',
    noMemo: 'Todavía no hay memo disponible.',
  },
}

function L(language, key) {
  return (labelMap[language] || labelMap.en)[key] || labelMap.en[key] || key
}

function compactList(items = [], max = 4) {
  return Array.isArray(items) ? items.slice(0, max) : []
}

function SectionCard({ title, icon, children, tone = 'slate' }) {
  const toneClass = {
    slate: 'border-line bg-ivory/70',
    blue: 'border-[#BFD8D3] bg-soft/70',
    amber: 'border-[#EAD8B6] bg-[#FBF3E4]/70',
    rose: 'border-[#E7CCCC] bg-[#F7EEEE]/70',
    green: 'border-[#CFE0D5] bg-[#EEF5F0]/70',
  }[tone]
  return (
    <section className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
        {icon}
        {title}
      </div>
      <div className="text-sm leading-6 text-muted">{children}</div>
    </section>
  )
}

export default function MemoPanel({ memo, language = 'en' }) {
  const [active, setActive] = useState('summary')
  const [expanded, setExpanded] = useState(false)

  const tabs = useMemo(() => [
    ['summary', L(language, 'summary'), FileText],
    ['evidence', L(language, 'evidence'), Layers],
    ['review', L(language, 'review'), CheckCircle2],
    ['limits', L(language, 'limits'), ShieldCheck],
  ], [language])

  if (!memo) {
    return <div className="card p-6 text-sm text-muted">{L(language, 'noMemo')}</div>
  }

  const maxItems = expanded ? 20 : 4

  return (
    <div className="card h-full overflow-hidden">
      <div className="border-b border-line p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="label">{L(language, 'kicker')}</p>
            <h3 className="mt-2 text-lg font-semibold text-ink">{memo.title}</h3>
            <p className="mt-1 text-xs text-subdued">{L(language, 'compact')}</p>
          </div>
          {memo.risk_band && (
            <span className="rounded-full bg-[#EFE9DF] px-3 py-1 text-xs font-semibold capitalize text-muted">
              {memo.risk_band}
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-ivory p-1 md:grid-cols-4">
          {tabs.map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${active === id ? 'bg-white text-accent shadow-sm' : 'text-muted hover:text-ink'}`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-[520px] overflow-auto p-5">
        {active === 'summary' && (
          <div className="space-y-4">
            <SectionCard title={L(language, 'current')} icon={<FileText size={16} />} tone="blue">
              <p>{memo.current_regime_summary}</p>
            </SectionCard>
            {memo.transition_risk && (
              <SectionCard title={L(language, 'transitionRisk')} icon={<AlertTriangle size={16} />} tone="amber">
                <p>{memo.transition_risk}</p>
              </SectionCard>
            )}
            {memo.data_quality && (
              <SectionCard title={L(language, 'dataQuality')} icon={<CheckCircle2 size={16} />} tone="slate">
                <p className="text-xs leading-5">{memo.data_quality}</p>
              </SectionCard>
            )}
          </div>
        )}

        {active === 'evidence' && (
          <div className="grid gap-3 sm:grid-cols-2">
            {compactList(memo.evidence_observed, maxItems).map((item, idx) => (
              <div key={idx} className="rounded-2xl border border-line bg-white p-4 text-sm leading-6 text-muted">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-subdued">#{idx + 1}</span>
                {item}
              </div>
            ))}
          </div>
        )}

        {active === 'review' && (
          <div className="space-y-4">
            <SectionCard title={L(language, 'validation')} icon={<CheckCircle2 size={16} />} tone="green">
              <ul className="space-y-2 text-xs leading-5">
                {compactList(memo.validation_checks, maxItems).map((item, idx) => <li key={idx}>• {item}</li>)}
              </ul>
            </SectionCard>
            <SectionCard title={L(language, 'considerations')} icon={<Layers size={16} />} tone="blue">
              <ul className="space-y-2">
                {compactList(memo.portfolio_review_considerations, maxItems).map((item, idx) => <li key={idx}>• {item}</li>)}
              </ul>
            </SectionCard>
          </div>
        )}

        {active === 'limits' && (
          <div className="space-y-4">
            <SectionCard title={L(language, 'limitations')} icon={<ShieldCheck size={16} />} tone="slate">
              <ul className="space-y-2 text-xs leading-5">
                {compactList(memo.model_limitations, expanded ? 20 : 6).map((item, idx) => <li key={idx}>• {item}</li>)}
              </ul>
            </SectionCard>
            <div className="rounded-2xl border border-line bg-white p-4 text-xs leading-5 text-muted">
              <div className="mb-2 font-semibold text-ink">{L(language, 'guardrails')}</div>
              <p>{memo.disclaimer}</p>
              <p className="mt-2 text-subdued">{memo.review_status}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line bg-ivory/70 px-5 py-3">
        <span className="text-xs text-subdued">LangGraph nodes: data quality → modeler → risk analyst → writer → guardrail</span>
        <button onClick={() => setExpanded((v) => !v)} className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-muted transition hover:border-[#BFD8D3] hover:text-accent">
          {expanded ? 'Compact' : L(language, 'showAll')}
        </button>
      </div>
    </div>
  )
}
