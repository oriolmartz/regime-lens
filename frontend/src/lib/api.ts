import type { AnalysisResult, AnalyzeRequest, CaseStudy, CompareRequest, CompareResult, LanguageCode, ProjectCard } from './types'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

async function parseResponse<T>(res: Response, fallbackMessage: string): Promise<T> {
  if (!res.ok) {
    let detail = fallbackMessage
    try {
      const body = await res.json()
      detail = body.detail || JSON.stringify(body)
    } catch {
      detail = await res.text()
    }
    throw new Error(detail || fallbackMessage)
  }
  return res.json() as Promise<T>
}

export async function fetchAssets(): Promise<{ assets: string[] }> {
  const res = await fetch(`${API_BASE}/assets`)
  return parseResponse(res, 'Failed to load assets')
}

export async function fetchTimeWindows(): Promise<{ windows: string[] }> {
  const res = await fetch(`${API_BASE}/time-windows`)
  return parseResponse(res, 'Failed to load time windows')
}

export async function fetchHealth(): Promise<{ status: string; version: string; [key: string]: unknown }> {
  const res = await fetch(`${API_BASE}/health`)
  return parseResponse(res, 'Failed to load API health')
}

export async function fetchCaseStudy(): Promise<CaseStudy> {
  const res = await fetch(`${API_BASE}/case-study`)
  return parseResponse(res, 'Failed to load case study')
}

export async function fetchProjectCard(): Promise<ProjectCard> {
  const res = await fetch(`${API_BASE}/project-card`)
  return parseResponse(res, 'Failed to load project card')
}

export async function analyzeAsset(payload: AnalyzeRequest): Promise<AnalysisResult> {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parseResponse(res, 'Analysis failed')
}

export async function uploadCsv(file: File, nRegimes = 3, language: LanguageCode = 'en'): Promise<AnalysisResult> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_BASE}/upload-csv?n_regimes=${nRegimes}&language=${language}`, {
    method: 'POST',
    body: form,
  })
  return parseResponse(res, 'CSV analysis failed')
}

export async function compareAssetSet(payload: CompareRequest): Promise<CompareResult> {
  const res = await fetch(`${API_BASE}/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parseResponse(res, 'Comparison failed')
}

export async function fetchQuickstart(): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/quickstart`)
  return parseResponse(res, 'Failed to load quickstart')
}
