import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { RegimePoint } from '../lib/types'

export default function FeatureBehaviorChart({ data }: { data?: RegimePoint[] }) {
  return (
    <div className="card p-6">
      <div className="mb-5">
        <p className="label">Feature behavior</p>
        <h3 className="mt-2 text-lg font-semibold text-ink">Momentum and RSI context</h3>
        <p className="mt-2 text-sm leading-6 text-muted">A compact view of two engineered features feeding the regime model. It helps explain whether the latest state is driven by trend exhaustion, momentum or volatility context.</p>
      </div>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data || []} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="#E4DDD2" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} tickMargin={10} minTickGap={36} />
            <YAxis yAxisId="left" tickFormatter={(v) => `${Math.round(Number(v) * 100)}%`} tick={{ fontSize: 11, fill: '#6B7280' }} width={58} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: '#6B7280' }} width={42} />
            <Tooltip
              contentStyle={{ border: '1px solid #E4DDD2', borderRadius: 14, boxShadow: '0 8px 30px rgba(20,33,61,.08)' }}
              formatter={(value, name) => {
                if (name === 'RSI') return [Number(value).toFixed(1), name]
                return [`${(Number(value) * 100).toFixed(1)}%`, name]
              }}
            />
            <Line yAxisId="left" type="monotone" dataKey="momentum_20" stroke="#2A6F68" strokeWidth={2} dot={false} name="20d momentum" />
            <Line yAxisId="right" type="monotone" dataKey="rsi" stroke="#B7791F" strokeWidth={2} dot={false} name="RSI" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
