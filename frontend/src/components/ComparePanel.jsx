import { translateRegimeLabel, translateRiskBand } from '../lib/i18n'

function pct(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${Math.round(value * 100)}%`
}

function toneForRisk(score = 0) {
  if (score >= 0.66) return 'bg-rose-50 text-rose-700 border-rose-100'
  if (score >= 0.38) return 'bg-amber-50 text-amber-700 border-amber-100'
  return 'bg-emerald-50 text-emerald-700 border-emerald-100'
}

const copy = {
  en: {
    kicker: 'Cross-asset review',
    title: 'Portfolio-level regime comparison',
    body: 'V5/V6 adds a comparison layer: run the same HMM + Markov regime engine across several assets and rank them by current review priority. This is a triage view, not a trading recommendation.',
    comparing: 'Comparing…',
    compare: 'Compare',
    assets: 'assets',
    highest: 'Highest review priority',
    average: 'Average risk score',
    lowest: 'Lowest risk score',
    ranked: 'Ranked summaries',
    currentByAsset: 'Current regime by asset',
    asset: 'Asset',
    regime: 'Regime',
    risk: 'Risk',
    stressTransition: 'Stress transition',
    drawdown: 'Drawdown',
    baseline: 'Baseline',
    data: 'Data',
    confidence: 'confidence',
    memo: 'Comparison memo',
  },
  es: {
    kicker: 'Revisión multi-activo',
    title: 'Comparación de regímenes a nivel portfolio',
    body: 'V5/V6 añade una capa de comparación: ejecuta el mismo motor HMM + Markov sobre varios activos y los ordena por prioridad actual de revisión. Es una vista de triage, no una recomendación de trading.',
    comparing: 'Comparando…',
    compare: 'Comparar',
    assets: 'activos',
    highest: 'Mayor prioridad de revisión',
    average: 'Score de riesgo medio',
    lowest: 'Menor score de riesgo',
    ranked: 'Resumen ordenado',
    currentByAsset: 'Régimen actual por activo',
    asset: 'Activo',
    regime: 'Régimen',
    risk: 'Riesgo',
    stressTransition: 'Transición a estrés',
    drawdown: 'Drawdown',
    baseline: 'Baseline',
    data: 'Datos',
    confidence: 'confianza',
    memo: 'Memo comparativo',
  },
}

function L(language, key) {
  return (copy[language] || copy.en)[key] || copy.en[key] || key
}

export default function ComparePanel({ assets, selectedAssets, setSelectedAssets, result, onRun, loading, language = 'en' }) {
  function toggleAsset(asset) {
    setSelectedAssets((current) => {
      if (current.includes(asset)) return current.filter((item) => item !== asset)
      if (current.length >= 8) return current
      return [...current, asset]
    })
  }

  return (
    <section className="space-y-6">
      <div className="card p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="label">{L(language, 'kicker')}</p>
            <h3 className="mt-2 text-xl font-semibold text-ink">{L(language, 'title')}</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{L(language, 'body')}</p>
          </div>
          <button onClick={onRun} disabled={loading || selectedAssets.length === 0} className="inline-flex h-11 items-center justify-center rounded-xl bg-brand px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? L(language, 'comparing') : `${L(language, 'compare')} ${selectedAssets.length} ${L(language, 'assets')}`}
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {(assets || []).map((asset) => {
            const active = selectedAssets.includes(asset)
            return (
              <button key={asset} onClick={() => toggleAsset(asset)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${active ? 'border-blue-200 bg-blue-50 text-brand' : 'border-line bg-white text-slate-500 hover:border-blue-200 hover:text-brand'}`}>
                {asset}
              </button>
            )
          })}
        </div>
      </div>

      {result && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{L(language, 'highest')}</p>
              <div className="mt-2 text-2xl font-semibold text-ink">{result.highest_risk_asset || '—'}</div>
            </div>
            <div className="card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{L(language, 'average')}</p>
              <div className="mt-2 text-2xl font-semibold text-ink">{pct(result.average_risk_score)}</div>
            </div>
            <div className="card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{L(language, 'lowest')}</p>
              <div className="mt-2 text-2xl font-semibold text-ink">{result.lowest_risk_asset || '—'}</div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-line p-5">
              <p className="label">{L(language, 'ranked')}</p>
              <h3 className="mt-2 text-lg font-semibold text-ink">{L(language, 'currentByAsset')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-line text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.14em] text-slate-400">
                  <tr>
                    <th className="px-5 py-3">{L(language, 'asset')}</th>
                    <th className="px-5 py-3">{L(language, 'regime')}</th>
                    <th className="px-5 py-3">{L(language, 'risk')}</th>
                    <th className="px-5 py-3">{L(language, 'stressTransition')}</th>
                    <th className="px-5 py-3">{L(language, 'drawdown')}</th>
                    <th className="px-5 py-3">{L(language, 'baseline')}</th>
                    <th className="px-5 py-3">{L(language, 'data')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line bg-white">
                  {(result.summaries || []).map((row) => (
                    <tr key={row.asset}>
                      <td className="px-5 py-4 font-semibold text-ink">{row.asset}</td>
                      <td className="px-5 py-4 text-slate-600">{translateRegimeLabel(row.current_regime, language)}<div className="text-xs text-slate-400">{pct(row.confidence)} {L(language, 'confidence')}</div></td>
                      <td className="px-5 py-4"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${toneForRisk(row.risk_score)}`}>{pct(row.risk_score)} · {translateRiskBand(row.risk_band, language)}</span></td>
                      <td className="px-5 py-4 text-slate-600">{pct(row.stress_transition_probability)}</td>
                      <td className="px-5 py-4 text-slate-600">{pct(row.latest_drawdown)}</td>
                      <td className="px-5 py-4 text-slate-600">{pct(row.baseline_agreement)} <span className="text-xs text-slate-400">{row.baseline_verdict}</span></td>
                      <td className="px-5 py-4 text-slate-600">{row.data_quality_status}<div className="text-xs text-slate-400">{row.source}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm leading-6 text-blue-900">
            <div className="font-semibold">{L(language, 'memo')}</div>
            <p className="mt-2">{result.portfolio_memo?.summary}</p>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              {(result.portfolio_memo?.review_notes || []).map((note, idx) => <li key={idx}>{note}</li>)}
            </ul>
          </div>
        </>
      )}
    </section>
  )
}
