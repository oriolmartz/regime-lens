import { Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { translateRegimeLabel } from '../lib/i18n'
import type { LanguageCode, RegimePoint, RegimeStats } from '../lib/types'

const COLORS = ['#2A6F68', '#B7791F', '#A04444', '#4A5568', '#64748B']

function pct(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${(value * 100).toFixed(1)}%`
}

function stateKey(regime: number | string) {
  return `state_probability_${regime}`
}

function meanEntropy(data: RegimePoint[]) {
  const values = data
    .map((point) => (typeof point.posterior_entropy === 'number' ? point.posterior_entropy : null))
    .filter((value): value is number => value !== null)
  if (!values.length) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export default function RegimeConfidenceChart({
  data = [],
  stats = [],
  language = 'en',
}: {
  data?: RegimePoint[]
  stats?: RegimeStats[]
  language?: LanguageCode
}) {
  const regimes = [...stats].sort((a, b) => Number(a.regime) - Number(b.regime))
  if (!data.length || !regimes.length) return null

  const avgEntropy = meanEntropy(data)
  const nearHard = avgEntropy !== null && avgEntropy < 0.03

  return (
    <div className="card p-6">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="label">State assignment dynamics</p>
          <h3 className="mt-2 text-lg font-semibold text-ink">Posterior state mass and uncertainty</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            The chart separates latent-state assignment strength from model uncertainty. In HMM terms, γ<sub>t</sub>(i) is the posterior state mass informed by forward evidence α and backward support β. The dashed entropy line highlights ambiguous transition zones and prevents a near one-hot assignment from being read as market certainty.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-ivory px-4 py-3 text-xs leading-5 text-muted lg:max-w-xs">
          <strong className="text-ink">Readable labels:</strong> state assignment + transition uncertainty<br />
          <strong className="text-ink">Technical base:</strong> γ<sub>t</sub>(i) ∝ α<sub>t</sub>(i) · β<sub>t</sub>(i); H(γ<sub>t</sub>)
        </div>
      </div>

      {nearHard && (
        <div className="mb-4 rounded-2xl border border-[#EACF9D] bg-[#FBF3E4] px-4 py-3 text-xs leading-5 text-warning">
          Posterior entropy is very low across this window. Read the curves as sharp latent-state assignments, not as directional market certainty.
        </div>
      )}

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 14, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="#E4DDD2" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} tickMargin={10} minTickGap={36} />
            <YAxis domain={[0, 1]} tickFormatter={(v) => `${Math.round(Number(v) * 100)}%`} tick={{ fontSize: 11, fill: '#6B7280' }} width={58} />
            <Tooltip
              contentStyle={{ border: '1px solid #E4DDD2', borderRadius: 14, boxShadow: '0 8px 30px rgba(20,33,61,.08)' }}
              formatter={(value, name) => [pct(Number(value)), name]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            {regimes.map((stat, idx) => (
              <Area
                key={stat.regime}
                type="monotone"
                dataKey={stateKey(stat.regime)}
                name={`S${stat.regime} · ${translateRegimeLabel(stat.label, language)}`}
                stroke={COLORS[idx % COLORS.length]}
                fill={COLORS[idx % COLORS.length]}
                fillOpacity={0.08}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
            <Line
              type="monotone"
              dataKey="posterior_entropy"
              name="Transition uncertainty H(γ)"
              stroke="#14213D"
              strokeDasharray="6 5"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <SmallExplainer title="Posterior state mass γ" body="Latent-state assignment mass at each timestamp after using the full observation sequence." />
        <SmallExplainer title="Forward / backward αβ" body="Forward evidence accumulates past information; backward support uses the future path inside the fitted sequence." />
        <SmallExplainer title="Entropy H(γ)" body="Uncertainty score. Near 0 means one state dominates; higher values mark ambiguous transition zones." />
      </div>
    </div>
  )
}

function SmallExplainer({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-3 text-xs leading-5 text-muted">
      <div className="font-semibold text-ink">{title}</div>
      <div className="mt-1">{body}</div>
    </div>
  )
}
