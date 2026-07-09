import { ArrowRight, BrainCircuit, Database, FileJson, MonitorCog, ShieldCheck, Workflow } from 'lucide-react'
import type { CaseStudy, ProjectCard } from '../lib/types'

const layers = [
  { title: 'Data services', body: 'Real-data loader, local cache, CSV parser and explicit offline sample generator.', icon: Database },
  { title: 'Feature engine', body: 'Transforms prices into model-ready return, volatility, drawdown, momentum and RSI features.', icon: Workflow },
  { title: 'Regime model', body: 'Fits hidden states, labels them post-fit and exposes assignment and uncertainty diagnostics.', icon: BrainCircuit },
  { title: 'Validation layer', body: 'Compares against baseline suite, checks transition stability, model selection and multi-seed robustness.', icon: ShieldCheck },
  { title: 'API contract', body: 'FastAPI endpoints return typed analysis, comparison, model-card and export payloads.', icon: FileJson },
  { title: 'Product UI', body: 'React/TypeScript interface for dashboarding, multi-asset triage and memo export.', icon: MonitorCog },
]

export default function ArchitecturePanel({ caseStudy, projectCard }: { caseStudy?: CaseStudy | null; projectCard?: ProjectCard | null }) {
  return (
    <div className="card p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="label">Architecture</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Full-stack regime intelligence system</h3>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            {caseStudy?.problem || 'Market data is noisy, regime shifts are hard to explain, and naive dashboards often hide model uncertainty.'}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-ivory p-4 text-xs leading-5 text-muted lg:max-w-xs">
          <strong className="block text-ink">Positioning</strong>
          {projectCard?.positioning || 'Risk review and model diagnostics, not autonomous trading.'}
        </div>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-6">
        {layers.map((layer, idx) => {
          const Icon = layer.icon
          return (
            <div key={layer.title} className="relative rounded-2xl border border-line bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-soft text-accent"><Icon size={17} /></div>
                {idx < layers.length - 1 && <ArrowRight className="hidden text-subdued lg:block" size={15} />}
              </div>
              <h4 className="text-sm font-semibold text-ink">{layer.title}</h4>
              <p className="mt-2 text-xs leading-5 text-muted">{layer.body}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
