export default function MetricCard({ label, value, detail, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-slate-50 text-slate-700',
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-rose-50 text-rose-700',
    green: 'bg-emerald-50 text-emerald-700',
  }
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
        <span className={`h-2 w-2 rounded-full ${tone === 'red' ? 'bg-rose-500' : tone === 'green' ? 'bg-emerald-500' : tone === 'amber' ? 'bg-amber-500' : 'bg-blue-500'}`} />
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-ink">{value}</div>
      {detail && <div className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>{detail}</div>}
    </div>
  )
}
