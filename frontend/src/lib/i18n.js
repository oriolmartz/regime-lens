export const LANGUAGES = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'es', label: 'ES', name: 'Español' },
]

const translations = {
  en: {
    edition: 'Bilingual Memo UX Edition · Full-stack AI risk intelligence',
    subtitleMeta: 'HMM · Markov Chains · LangGraph · V6',
    heroTitle: 'Market regime intelligence that explains uncertainty.',
    heroBody: 'RegimeLens detects hidden market states with HMMs, estimates Markov transition risk, compares assets against a transparent volatility baseline and generates guarded executive memos through a LangGraph workflow.',
    runAnalysis: 'Run analysis',
    notAdvice: 'Not financial advice. No directional trading instructions.',
    currentRegime: 'Current regime',
    confidence: 'Confidence',
    riskScore: 'Risk score',
    baselineAgreement: 'Baseline agreement',
    source: 'Source',
    risk: 'risk',
    asset: 'Asset',
    window: 'Window',
    startOverride: 'Start override',
    regimes: 'Regimes',
    analyze: 'Analyze',
    analyzing: 'Analyzing…',
    liveData: 'Try live data + cache',
    uploadCsv: 'Upload CSV',
    csvHelp: 'CSV: date, close, optional volume. Minimum 180 rows.',
    markdown: 'Markdown',
    json: 'JSON',
    summary: 'Summary',
    copied: 'Copied',
    warnings: 'Warnings / guardrails',
    dashboard: 'Dashboard',
    validation: 'Validation',
    compare: 'Compare',
    caseStudy: 'Case Study',
    export: 'Export',
    stayProbability: 'Stay probability',
    markovPersistence: 'Markov persistence',
    stressTransition: 'Stress transition',
    nextStateRisk: 'Next-state risk',
    sourceCached: 'Cached live data',
    sourceLive: 'Live data',
    sourceCsv: 'Uploaded CSV',
    sourceSample: 'Deterministic sample',
    contained: 'Contained',
    moderate: 'Moderate',
    elevated: 'Elevated',
    errorGeneric: 'Something went wrong',
    comparisonFailed: 'Comparison failed',
    csvFailed: 'CSV upload failed',
    portfolioSummaryLatest: 'Latest demo',
    confidenceLower: 'confidence',
    observations: 'Observations',
    meanReturn: 'Mean return',
    annVolatility: 'Ann. volatility',
    meanDrawdown: 'Mean drawdown',
    regimeProfiles: 'Regime profiles',
    stateStats: 'State-level statistics',
  },
  es: {
    edition: 'Edición bilingüe y memo compacto · Inteligencia de riesgo con IA',
    subtitleMeta: 'HMM · Cadenas de Markov · LangGraph · V6',
    heroTitle: 'Inteligencia de regímenes de mercado que explica la incertidumbre.',
    heroBody: 'RegimeLens detecta estados ocultos de mercado con HMM, estima riesgo de transición con cadenas de Markov, compara activos contra un baseline transparente de volatilidad y genera memos ejecutivos con guardrails mediante un workflow LangGraph.',
    runAnalysis: 'Ejecutar análisis',
    notAdvice: 'No es asesoramiento financiero. No genera instrucciones de compra/venta.',
    currentRegime: 'Régimen actual',
    confidence: 'Confianza',
    riskScore: 'Score de riesgo',
    baselineAgreement: 'Acuerdo con baseline',
    source: 'Fuente',
    risk: 'riesgo',
    asset: 'Activo',
    window: 'Ventana',
    startOverride: 'Inicio manual',
    regimes: 'Regímenes',
    analyze: 'Analizar',
    analyzing: 'Analizando…',
    liveData: 'Probar datos live + caché',
    uploadCsv: 'Subir CSV',
    csvHelp: 'CSV: date, close, volumen opcional. Mínimo 180 filas.',
    markdown: 'Markdown',
    json: 'JSON',
    summary: 'Resumen',
    copied: 'Copiado',
    warnings: 'Warnings / guardrails',
    dashboard: 'Panel',
    validation: 'Validación',
    compare: 'Comparar',
    caseStudy: 'Caso de estudio',
    export: 'Exportar',
    stayProbability: 'Prob. de permanencia',
    markovPersistence: 'Persistencia Markov',
    stressTransition: 'Transición a estrés',
    nextStateRisk: 'Riesgo próximo estado',
    sourceCached: 'Datos live en caché',
    sourceLive: 'Datos live',
    sourceCsv: 'CSV subido',
    sourceSample: 'Muestra determinista',
    contained: 'Contenido',
    moderate: 'Moderado',
    elevated: 'Elevado',
    errorGeneric: 'Algo ha fallado',
    comparisonFailed: 'La comparación ha fallado',
    csvFailed: 'La subida CSV ha fallado',
    portfolioSummaryLatest: 'Última demo',
    confidenceLower: 'confianza',
    observations: 'Observaciones',
    meanReturn: 'Retorno medio',
    annVolatility: 'Volatilidad anual',
    meanDrawdown: 'Drawdown medio',
    regimeProfiles: 'Perfiles de régimen',
    stateStats: 'Estadísticas por estado',
  },
}

export function getTranslator(language = 'en') {
  const lang = translations[language] ? language : 'en'
  return function t(key) {
    return translations[lang][key] || translations.en[key] || key
  }
}

export function translateRiskBand(label, language = 'en') {
  const normalized = String(label || '').toLowerCase()
  if (language !== 'es') return label || '—'
  if (normalized.includes('elevated')) return 'Elevado'
  if (normalized.includes('moderate')) return 'Moderado'
  if (normalized.includes('contained')) return 'Contenido'
  return label || '—'
}

export function translateRegimeLabel(label, language = 'en') {
  if (!label || language !== 'es') return label || '—'
  return String(label)
    .replace(/Low-volatility expansion/gi, 'Expansión de baja volatilidad')
    .replace(/High-volatility stress/gi, 'Estrés de alta volatilidad')
    .replace(/Sideways \/ transition/gi, 'Lateral / transición')
    .replace(/Transition/gi, 'Transición')
    .replace(/Expansion/gi, 'Expansión')
    .replace(/Stress/gi, 'Estrés')
}
