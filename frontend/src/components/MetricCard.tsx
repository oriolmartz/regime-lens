import type { RiskTone } from '../lib/types'

export default function MetricCard({ label, value, detail, tone = 'neutral' }: { label: string; value: string; detail?: string; tone?: RiskTone }) {
  const tones: Record<RiskTone, string> = {
    neutral: 'bg-ivory text-ink',
    blue: 'bg-soft text-accent',
    amber: 'bg-[#FBF3E4] text-warning',
    red: 'bg-[#F7EEEE] text-danger',
    green: 'bg-[#EEF5F0] text-positive',
  }
  const dots: Record<RiskTone, string> = {
    neutral: 'bg-neutral',
    blue: 'bg-accent',
    amber: 'bg-warning',
    red: 'bg-danger',
    green: 'bg-positive',
  }
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-subdued">{label}</p>
        <span className={`h-2 w-2 rounded-full ${dots[tone]}`} />
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-ink">{value}</div>
      {detail && <div className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>{detail}</div>}
    </div>
  )
}
