import ArchitecturePanel from './ArchitecturePanel'
import type { CaseStudy, ProjectCard } from '../lib/types'

export default function CaseStudyPanel({ caseStudy, projectCard }: { caseStudy?: CaseStudy | null; projectCard?: ProjectCard | null }) {
  return (
    <div className="space-y-6">
      <ArchitecturePanel caseStudy={caseStudy} projectCard={projectCard} />

      <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <div className="card p-6">
          <p className="label">Portfolio card</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-ink">{projectCard?.name || 'QuantRegimeTracer'}</h3>
          <p className="mt-3 text-sm leading-6 text-muted">{projectCard?.tagline || 'From noisy market time series to structured regime intelligence.'}</p>
          <p className="mt-5 text-sm leading-7 text-muted">{projectCard?.description}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {(projectCard?.stack || []).map((item) => <span key={item} className="rounded-lg bg-soft px-2.5 py-1 text-xs font-medium text-accent">{item}</span>)}
          </div>
          <div className="mt-5 rounded-2xl border border-line bg-ivory p-4 text-xs leading-5 text-muted">
            <strong className="block text-ink">Positioning</strong>
            {projectCard?.positioning || 'Risk review, not autonomous trading.'}
          </div>
          <div className="mt-3 rounded-2xl border border-[#BFD8D3] bg-soft p-4 text-xs leading-5 text-muted">
            <strong className="block text-ink">Author</strong>
            Built by Oriol Martínez as a full-stack AI/quant research workbench for auditable market-regime inference.
          </div>
        </div>

        <div className="card p-6">
          <p className="label">Case study</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-ink">{caseStudy?.title || 'Real-Data Validation Engine'}</h3>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Section title="Problem" items={[caseStudy?.problem]} />
            <Section title="Architecture" items={caseStudy?.architecture || []} />
            <Section title="Approach" items={caseStudy?.approach || []} />
            <Section title="Limitations" items={caseStudy?.limitations || []} />
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, items }: { title: string; items?: Array<string | undefined> }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <h4 className="mb-3 text-sm font-semibold text-ink">{title}</h4>
      <ul className="space-y-2 text-xs leading-5 text-muted">
        {(items || []).filter(Boolean).map((item, idx) => <li key={idx}>• {item}</li>)}
      </ul>
    </div>
  )
}
