import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'

export default function VolatilityChart({ data }) {
  return (
    <div className="card p-6">
      <div className="mb-5">
        <p className="label">Volatility context</p>
        <h3 className="mt-2 text-lg font-semibold text-ink">Rolling annualized volatility</h3>
      </div>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="#E4DDD2" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} tickMargin={10} minTickGap={36} />
            <YAxis tickFormatter={(v) => `${Math.round(v * 100)}%`} tick={{ fontSize: 11, fill: '#6B7280' }} width={58} />
            <Tooltip
              contentStyle={{ border: '1px solid #E4DDD2', borderRadius: 14, boxShadow: '0 8px 30px rgba(20,33,61,.08)' }}
              formatter={(value) => [`${(Number(value) * 100).toFixed(1)}%`, 'Rolling vol']}
            />
            <Area type="monotone" dataKey="rolling_volatility" stroke="#2A6F68" fill="#E3F1EE" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
