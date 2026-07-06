import { useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, ArrowRight, BarChart3, BookOpen, Copy, Database, Download, FileText, FileUp, Layers, RefreshCw, ShieldCheck } from 'lucide-react'
import { analyzeAsset, compareAssetSet, fetchAssets, fetchCaseStudy, fetchHealth, fetchProjectCard, fetchTimeWindows, uploadCsv } from './lib/api'
import { LANGUAGES, getTranslator, translateRegimeLabel, translateRiskBand } from './lib/i18n'
import MetricCard from './components/MetricCard'
import MemoPanel from './components/MemoPanel'
import PriceRegimeChart from './components/PriceRegimeChart'
import TransitionMatrix from './components/TransitionMatrix'
import VolatilityChart from './components/VolatilityChart'
import DrawdownChart from './components/DrawdownChart'
import RegimeProbabilityStrip from './components/RegimeProbabilityStrip'
import DiagnosticsPanel from './components/DiagnosticsPanel'
import BenchmarkPanel from './components/BenchmarkPanel'
import TimelineSegments from './components/TimelineSegments'
import ModelCardPanel from './components/ModelCardPanel'
import DataQualityPanel from './components/DataQualityPanel'
import BaselineComparisonPanel from './components/BaselineComparisonPanel'
import CaseStudyPanel from './components/CaseStudyPanel'
import ExportPanel from './components/ExportPanel'
import ComparePanel from './components/ComparePanel'

function pct(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${Math.round(value * 100)}%`
}

function riskTone(score = 0) {
  if (score >= 0.66) return 'red'
  if (score >= 0.38) return 'amber'
  return 'green'
}

function riskBandLabel(score = 0, language = 'en') {
  if (score >= 0.66) return language === 'es' ? 'Elevado' : 'Elevated'
  if (score >= 0.38) return language === 'es' ? 'Moderado' : 'Moderate'
  return language === 'es' ? 'Contenido' : 'Contained'
}

function downloadBlob(filename, content, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function downloadJson(result) {
  if (!result) return
  downloadBlob(`regimelens_${result.asset}_${result.end || 'analysis'}.json`, JSON.stringify(result, null, 2), 'application/json')
}

function downloadReport(result) {
  if (!result?.report_markdown) return
  downloadBlob(`regimelens_${result.asset}_${result.end || 'report'}.md`, result.report_markdown, 'text/markdown')
}

function sourceLabel(source, t) {
  if (!source) return '—'
  if (source.includes('cache')) return t('sourceCached')
  if (source === 'yfinance') return t('sourceLive')
  if (source === 'uploaded_csv') return t('sourceCsv')
  return t('sourceSample')
}

export default function App() {
  const [language, setLanguage] = useState(() => localStorage.getItem('regimelens_language') || 'en')
  const t = useMemo(() => getTranslator(language), [language])
  const [assets, setAssets] = useState(['SPY', 'QQQ', 'BTC-USD', 'ETH-USD', 'AAPL', 'MSFT', 'NVDA', 'META', 'IWM', 'DIA', 'GLD', 'TLT'])
  const [windows, setWindows] = useState(['6M', '1Y', '3Y', '5Y', 'MAX'])
  const [asset, setAsset] = useState('SPY')
  const [preferLiveData, setPreferLiveData] = useState(false)
  const [interval, setInterval] = useState('5Y')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [nRegimes, setNRegimes] = useState(3)
  const [apiHealth, setApiHealth] = useState(null)
  const [caseStudy, setCaseStudy] = useState(null)
  const [projectCard, setProjectCard] = useState(null)
  const [result, setResult] = useState(null)
  const [comparison, setComparison] = useState(null)
  const [selectedCompareAssets, setSelectedCompareAssets] = useState(['SPY', 'QQQ', 'BTC-USD'])
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function runAnalysis(selectedAsset = asset) {
    setLoading(true)
    setError('')
    try {
      const data = await analyzeAsset({
        asset: selectedAsset,
        start: start || null,
        end: end || null,
        interval,
        n_regimes: Number(nRegimes),
        prefer_live_data: preferLiveData,
        language,
      })
      setResult(data)
      setActiveTab('dashboard')
    } catch (err) {
      setError(err.message || t('errorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  async function handleCsvUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const data = await uploadCsv(file, Number(nRegimes), language)
      setResult(data)
      setActiveTab('dashboard')
    } catch (err) {
      setError(err.message || t('csvFailed'))
    } finally {
      setLoading(false)
      event.target.value = ''
    }
  }


  async function runComparison() {
    setLoading(true)
    setError('')
    try {
      const data = await compareAssetSet({
        assets: selectedCompareAssets,
        start: start || null,
        end: end || null,
        interval,
        n_regimes: Number(nRegimes),
        prefer_live_data: preferLiveData,
        language,
      })
      setComparison(data)
      setActiveTab('compare')
    } catch (err) {
      setError(err.message || t('comparisonFailed'))
    } finally {
      setLoading(false)
    }
  }

  function copyPortfolioSummary() {
    if (!projectCard && !result) return
    const summary = `${projectCard?.name || 'RegimeLens'} — ${projectCard?.tagline || 'Time-series regime intelligence'}\n\n${projectCard?.description || ''}\n\n${t('portfolioSummaryLatest')}: ${result?.asset || asset}, ${translateRegimeLabel(result?.current_regime?.label || 'regime analysis', language)}, ${pct(result?.current_regime?.confidence)} ${t('confidenceLower')}.`
    navigator.clipboard?.writeText(summary)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  useEffect(() => {
    fetchAssets().then((d) => setAssets(d.assets || assets)).catch(() => {})
    fetchTimeWindows().then((d) => setWindows(d.windows || windows)).catch(() => {})
    fetchHealth().then(setApiHealth).catch(() => {})
    fetchCaseStudy().then(setCaseStudy).catch(() => {})
    fetchProjectCard().then(setProjectCard).catch(() => {})
    compareAssetSet({ assets: selectedCompareAssets, interval, n_regimes: Number(nRegimes), prefer_live_data: false, language }).then(setComparison).catch(() => {})
    runAnalysis('SPY')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    localStorage.setItem('regimelens_language', language)
  }, [language])

  const currentTone = useMemo(() => {
    const label = result?.current_regime?.label?.toLowerCase() || ''
    if (label.includes('stress')) return 'red'
    if (label.includes('expansion')) return 'green'
    return 'amber'
  }, [result])

  const riskBand = useMemo(() => riskBandLabel(result?.current_regime?.risk_score || 0, language), [result, language])

  const tabs = [
    ['dashboard', t('dashboard'), Activity],
    ['validation', t('validation'), Layers],
    ['compare', t('compare'), BarChart3],
    ['case', t('caseStudy'), BookOpen],
    ['export', t('export'), FileText],
  ]

  return (
    <div className="min-h-screen">
      <header className="relative overflow-hidden border-b border-white/10 bg-dark text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,.28),transparent_38%),linear-gradient(135deg,#0B1120_0%,#0F172A_55%,#111827_100%)]" />
        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand shadow-lg shadow-blue-900/30">
              <Activity size={19} />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">RegimeLens</div>
              <div className="text-[11px] text-blue-200/70">{t('subtitleMeta')}</div>
            </div>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
              API {apiHealth?.status || 'checking'} · {apiHealth?.version || '0.6.0'}
            </span>
            <div className="flex rounded-full border border-white/10 bg-white/[0.04] p-1">
              {LANGUAGES.map((item) => (
                <button key={item.code} onClick={() => setLanguage(item.code)} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${language === item.code ? 'bg-white text-slate-950' : 'text-blue-100 hover:text-white'}`}>
                  {item.label}
                </button>
              ))}
            </div>
            <button onClick={() => downloadReport(result)} className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-blue-100 transition hover:border-blue-300/40">{t('export')} memo</button>
            <button onClick={() => downloadJson(result)} className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-blue-100 transition hover:border-blue-300/40">{t('export')} JSON</button>
          </div>
        </nav>

        <section className="relative z-10 mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-20">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs font-semibold text-blue-200">
              {t('edition')}
            </div>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
              {t('heroTitle')}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300">
              {t('heroBody')}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button onClick={() => runAnalysis()} className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:bg-blue-700">
                {t('runAnalysis')} <ArrowRight size={16} />
              </button>
              <span className="inline-flex items-center gap-2 text-xs text-slate-400"><ShieldCheck size={15} /> {t('notAdvice')}</span>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-blue-950/20 backdrop-blur">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-200/70">{t('currentRegime')}</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{translateRegimeLabel(result?.current_regime?.label, language) || 'Loading…'}</h2>
              </div>
              <span className="rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-xs font-semibold text-blue-200">{riskBand} {t('risk')}</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <HeroStat label={t('confidence')} value={pct(result?.current_regime?.confidence)} />
              <HeroStat label={t('riskScore')} value={pct(result?.current_regime?.risk_score)} />
              <HeroStat label={t('baselineAgreement')} value={pct(result?.baseline?.stress_agreement)} />
              <HeroStat label={t('source')} value={sourceLabel(result?.source, t)} />
            </div>
          </div>
        </section>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <section className="card mb-6 p-4">
          <div className="grid gap-4 md:grid-cols-[1fr_.7fr_.7fr_.7fr_auto] md:items-end">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{t('asset')}</label>
              <select className="input w-full" value={asset} onChange={(e) => setAsset(e.target.value)}>
                {assets.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{t('window')}</label>
              <select className="input w-full" value={interval} onChange={(e) => setInterval(e.target.value)}>
                {windows.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{t('startOverride')}</label>
              <input className="input w-full" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{t('regimes')}</label>
              <select className="input w-full min-w-[105px]" value={nRegimes} onChange={(e) => setNRegimes(e.target.value)}>
                {[2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <button disabled={loading} onClick={() => runAnalysis()} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? <RefreshCw className="animate-spin" size={16} /> : <Database size={16} />}
              {loading ? t('analyzing') : t('analyze')}
            </button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex h-11 items-center gap-3 rounded-xl border border-line bg-slate-50 px-4 text-sm font-medium text-slate-600">
                <input type="checkbox" checked={preferLiveData} onChange={(e) => setPreferLiveData(e.target.checked)} />
                {t('liveData')}
              </label>
              <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-brand">
                <FileUp size={16} /> {t('uploadCsv')}
                <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
              </label>
              <span className="text-xs text-slate-400">{t('csvHelp')}</span>
            </div>
            <button onClick={() => downloadReport(result)} disabled={!result} className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-brand disabled:opacity-50">
              <FileText size={16} /> {t('markdown')}
            </button>
            <button onClick={() => downloadJson(result)} disabled={!result} className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-brand disabled:opacity-50">
              <Download size={16} /> {t('json')}
            </button>
            <button onClick={copyPortfolioSummary} disabled={!result} className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-brand disabled:opacity-50">
              <Copy size={16} /> {copied ? t('copied') : t('summary')}
            </button>
          </div>
          {error && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
          {result?.warnings?.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
              <div className="mb-1 flex items-center gap-2 font-semibold"><AlertTriangle size={14} /> {t('warnings')}</div>
              {result.warnings.slice(0, 5).map((w, i) => <div key={i}>• {w}</div>)}
            </div>
          )}
        </section>

        <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-line bg-white p-2 shadow-premium">
          {tabs.map(([id, label, Icon]) => (
            <button key={id} onClick={() => setActiveTab(id)} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab === id ? 'bg-brand text-white shadow-lg shadow-blue-100' : 'text-slate-500 hover:bg-slate-50 hover:text-ink'}`}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {result && activeTab === 'dashboard' && (
          <>
            <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <MetricCard label={t('currentRegime')} value={translateRegimeLabel(result.current_regime.label, language)} detail={`${pct(result.current_regime.confidence)} ${t('confidenceLower')}`} tone={currentTone} />
              <MetricCard label={t('riskScore')} value={pct(result.current_regime.risk_score)} detail={riskBand} tone={riskTone(result.current_regime.risk_score)} />
              <MetricCard label={t('stayProbability')} value={pct(result.current_regime.stay_probability)} detail={t('markovPersistence')} tone="blue" />
              <MetricCard label={t('stressTransition')} value={pct(result.current_regime.stress_transition_probability)} detail={t('nextStateRisk')} tone={result.current_regime.stress_transition_probability > 0.25 ? 'red' : 'amber'} />
              <MetricCard label={t('baselineAgreement')} value={pct(result.baseline?.stress_agreement)} detail={result.baseline?.verdict || t('validation')} tone="neutral" />
            </section>

            <section className="mb-6 grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
              <PriceRegimeChart data={result.time_series} />
              <MemoPanel memo={result.memo} language={language} />
            </section>

            <section className="mb-6 grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
              <RegimeProbabilityStrip stats={result.regime_stats} />
              <TransitionMatrix matrix={result.transition_matrix} labels={result.transition_labels} />
            </section>

            <section className="mb-6 grid gap-6 xl:grid-cols-2">
              <VolatilityChart data={result.time_series} />
              <DrawdownChart data={result.time_series} />
            </section>
          </>
        )}

        {result && activeTab === 'validation' && (
          <>
            <section className="mb-6 grid gap-6 xl:grid-cols-2">
              <BenchmarkPanel baseline={result.baseline} stability={result.stability} />
              <DataQualityPanel quality={result.data_quality} />
            </section>
            <section className="mb-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
              <BaselineComparisonPanel baseline={result.baseline} />
              <TimelineSegments segments={result.regime_segments} />
            </section>
            <section className="mb-6 grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
              <DiagnosticsPanel diagnostics={result.diagnostics} />
              <RegimeProfiles stats={result.regime_stats} t={t} language={language} />
            </section>
            <section className="mb-10">
              <ModelCardPanel modelCard={result.model_card} />
            </section>
          </>
        )}

        {activeTab === 'compare' && (
          <ComparePanel
            assets={assets}
            selectedAssets={selectedCompareAssets}
            setSelectedAssets={setSelectedCompareAssets}
            result={comparison}
            onRun={runComparison}
            loading={loading}
            language={language}
          />
        )}

        {activeTab === 'case' && <CaseStudyPanel caseStudy={caseStudy} projectCard={projectCard} />}

        {result && activeTab === 'export' && (
          <ExportPanel
            result={result}
            onDownloadReport={() => downloadReport(result)}
            onDownloadJson={() => downloadJson(result)}
            onCopySummary={copyPortfolioSummary}
          />
        )}
      </main>
    </div>
  )
}

function HeroStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-2 text-xl font-semibold text-white">{value}</div>
    </div>
  )
}

function RegimeProfiles({ stats, t, language }) {
  return (
    <div className="card p-6">
      <p className="label">{t('regimeProfiles')}</p>
      <h3 className="mt-2 text-lg font-semibold text-ink">{t('stateStats')}</h3>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(stats || []).map((stat) => (
          <div key={stat.regime} className="rounded-2xl border border-line bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="font-semibold text-ink">{translateRegimeLabel(stat.label, language)}</h4>
              <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-brand">S{stat.regime}</span>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between"><span>{t('observations')}</span><strong>{stat.observations}</strong></div>
              <div className="flex justify-between"><span>{t('meanReturn')}</span><strong>{pct(stat.mean_return)}</strong></div>
              <div className="flex justify-between"><span>{t('annVolatility')}</span><strong>{pct(stat.annualized_volatility)}</strong></div>
              <div className="flex justify-between"><span>{t('meanDrawdown')}</span><strong>{pct(stat.mean_drawdown)}</strong></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
