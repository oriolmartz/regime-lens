export type LanguageCode = 'en' | 'es'
export type RiskTone = 'red' | 'amber' | 'green' | 'blue' | 'neutral'


export interface BaselineDisagreementSegment {
  start: string
  end: string
  observations: number
  hmm_stress_share?: number
  baseline_stress_share?: number
}

export interface BaselineReport {
  name?: string
  description?: string
  latest_state?: number
  latest_label?: string
  stress_agreement?: number
  disagreement_rate?: number
  verdict?: string
  distribution?: Array<{ bucket: number; observations: number; share: number }>
  disagreement_segments?: BaselineDisagreementSegment[]
  interpretation?: string
}

export interface StabilityReport {
  status?: string
  message?: string
  frobenius_distance?: number | null
}

export interface DataQualityReport {
  status?: string
  source?: string
  cache_hit?: boolean
  observations?: number
  date_start?: string | null
  date_end?: string | null
  date_span_days?: number
  largest_gap_days?: number
  duplicate_dates?: number
  missing_close?: number
  missing_volume?: number | null
  notes?: string[]
}

export interface DiagnosticsReport {
  model_type?: string
  n_observations?: number
  n_features?: number
  n_regimes?: number
  confidence_status?: string
  separability_score?: number | null
  notes?: string[]
  [key: string]: unknown
}

export interface RegimeSegment {
  start: string
  end: string
  regime: number
  label: string
  observations: number
  segment_return?: number
  max_drawdown?: number
}

export interface ModelCard {
  model_name?: string
  version?: string
  model_type?: string
  intended_use?: string
  not_intended_for?: string[]
  inputs?: string[]
  outputs?: string[]
  assumptions?: string[]
  failure_modes?: string[]
  guardrails?: string[]
  [key: string]: unknown
}

export interface RankedAssetSummary {
  asset: string
  rank?: number
  risk_score?: number
  current_label?: string
  current_regime?: string
  confidence?: number
  risk_band?: string
  stress_transition_probability?: number
  stay_probability?: number
  latest_drawdown?: number
  annualized_volatility?: number
  baseline_agreement?: number
  baseline_verdict?: string
  data_quality_status?: string
  source?: string
  [key: string]: unknown
}

export interface LanguageOption {
  code: LanguageCode
  label: string
  name: string
}

export interface AnalyzeRequest {
  asset: string
  start?: string | null
  end?: string | null
  interval?: string
  n_regimes?: number
  prefer_live_data?: boolean
  language?: LanguageCode
}

export interface CompareRequest {
  assets: string[]
  start?: string | null
  end?: string | null
  interval?: string
  n_regimes?: number
  prefer_live_data?: boolean
  language?: LanguageCode
}

export interface RegimePoint {
  date: string
  close?: number
  price?: number
  return?: number
  log_return?: number
  rolling_volatility?: number
  drawdown?: number
  regime?: number | string
  regime_label?: string
  baseline_label?: string
  [key: string]: string | number | boolean | null | undefined
}

export interface CurrentRegime {
  label: string
  confidence?: number
  risk_score?: number
  stay_probability?: number
  stress_transition_probability?: number
  [key: string]: unknown
}

export interface RegimeStats {
  regime: number | string
  label: string
  observations?: number
  mean_return?: number
  annualized_volatility?: number
  mean_drawdown?: number
  [key: string]: unknown
}

export interface MemoSectioned {
  summary?: string[]
  evidence?: string[]
  review?: string[]
  limitations?: string[]
  [key: string]: string[] | string | undefined
}

export interface AnalysisResult {
  api_version?: string
  asset: string
  start?: string
  end?: string
  source?: string
  current_regime: CurrentRegime
  time_series: RegimePoint[]
  regime_stats?: RegimeStats[]
  transition_matrix?: number[][]
  transition_labels?: string[]
  baseline?: BaselineReport
  stability?: StabilityReport
  data_quality?: DataQualityReport
  diagnostics?: DiagnosticsReport
  regime_segments?: RegimeSegment[]
  model_card?: ModelCard
  memo?: MemoSectioned | string | Record<string, unknown>
  report_markdown?: string
  warnings?: string[]
  [key: string]: unknown
}

export interface CompareResult {
  api_version?: string
  assets?: string[]
  ranked_assets?: RankedAssetSummary[]
  summaries?: RankedAssetSummary[]
  memo?: MemoSectioned | string | Record<string, unknown>
  portfolio_memo?: { summary?: string; review_notes?: string[]; [key: string]: unknown }
  highest_risk_asset?: string | null
  lowest_risk_asset?: string | null
  average_risk_score?: number
  [key: string]: unknown
}

export interface ProjectCard {
  name?: string
  tagline?: string
  description?: string
  stack?: string[]
  positioning?: string
  [key: string]: unknown
}

export interface CaseStudy {
  title?: string
  problem?: string
  architecture?: string[]
  approach?: string[]
  limitations?: string[]
  [key: string]: unknown
}
