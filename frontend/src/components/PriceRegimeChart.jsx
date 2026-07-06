import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, ReferenceArea } from 'recharts'

const palette = ['#DBEAFE', '#FEF3C7', '#FFE4E6', '#DCFCE7', '#EDE9FE']

function buildSegments(data) {
  if (!data?.length) return []
  const segments = []
  let start = data[0].date
  let regime = data[0].regime
  for (let i = 1; i < data.length; i++) {
    if (data[i].regime !== regime) {
      segments.push({ start, end: data[i - 1].date, regime })
      start = data[i].date
      regime = data[i].regime
    }
  }
  segments.push({ start, end: data[data.length - 1].date, regime })
  return segments
}

export default function PriceRegimeChart({ data }) {
  const segments = buildSegments(data)
  return (
    <div className="card p-6">
      <div className="mb-5">
        <p className="label">Regime chart</p>
        <h3 className="mt-2 text-lg font-semibold text-ink">Price path with inferred regimes</h3>
      </div>
      <div className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} tickMargin={10} minTickGap={36} />
            <YAxis tick={{ fontSize: 11, fill: '#64748B' }} domain={['auto', 'auto']} width={58} />
            <Tooltip
              contentStyle={{ border: '1px solid #E2E8F0', borderRadius: 14, boxShadow: '0 8px 30px rgba(15,23,42,.08)' }}
              formatter={(value, name) => [Number(value).toFixed(2), name]}
            />
            {segments.map((seg, idx) => (
              <ReferenceArea
                key={idx}
                x1={seg.start}
                x2={seg.end}
                fill={palette[seg.regime % palette.length]}
                fillOpacity={0.26}
                strokeOpacity={0}
              />
            ))}
            <Line type="monotone" dataKey="close" stroke="#2563EB" strokeWidth={2.2} dot={false} name="Close" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
