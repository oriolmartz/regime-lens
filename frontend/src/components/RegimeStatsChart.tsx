import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { translateRegimeLabel } from '../lib/i18n'
import type { LanguageCode, RegimeStats } from '../lib/types'

function pctLabel(value: number) {
  return `${Math.round(value * 100)}%`
}

export default function RegimeStatsChart({ stats, language = 'en' }: { stats?: RegimeStats[]; language?: LanguageCode }) {
  const data = (stats || []).map((row) => ({
    name: translateRegimeLabel(row.label, language),
    volatility: row.annualized_volatility || 0,
    drawdown: Math.abs(row.mean_drawdown || 0),
    meanReturn: row.mean_return || 0,
  }))

  return (
    <div className="card p-6">
      <div className="mb-5">
        <p className="label">Regime feature map</p>
        <h3 className="mt-2 text-lg font-semibold text-ink">How the inferred states differ</h3>
        <p className="mt-2 text-sm leading-6 text-muted">This chart makes the regime labels auditable: stress states should normally show higher volatility or deeper drawdown than expansion states.</p>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, bottom: 16, left: 0 }}>
            <CartesianGrid stroke="#E4DDD2" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} interval={0} height={54} />
            <YAxis tickFormatter={pctLabel} tick={{ fontSize: 11, fill: '#6B7280' }} width={58} />
            <Tooltip
              contentStyle={{ border: '1px solid #E4DDD2', borderRadius: 14, boxShadow: '0 8px 30px rgba(20,33,61,.08)' }}
              formatter={(value, name) => [`${(Number(value) * 100).toFixed(2)}%`, name]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="volatility" name="Ann. volatility" fill="#2A6F68" radius={[6, 6, 0, 0]} />
            <Bar dataKey="drawdown" name="Abs. drawdown" fill="#A04444" radius={[6, 6, 0, 0]} />
            <Bar dataKey="meanReturn" name="Mean return" fill="#14213D" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
