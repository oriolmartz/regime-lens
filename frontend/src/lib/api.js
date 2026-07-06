const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

async function parseResponse(res, fallbackMessage) {
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
  return res.json()
}

export async function fetchAssets() {
  const res = await fetch(`${API_BASE}/assets`)
  return parseResponse(res, 'Failed to load assets')
}

export async function fetchTimeWindows() {
  const res = await fetch(`${API_BASE}/time-windows`)
  return parseResponse(res, 'Failed to load time windows')
}

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`)
  return parseResponse(res, 'Failed to load API health')
}

export async function fetchCaseStudy() {
  const res = await fetch(`${API_BASE}/case-study`)
  return parseResponse(res, 'Failed to load case study')
}

export async function fetchProjectCard() {
  const res = await fetch(`${API_BASE}/project-card`)
  return parseResponse(res, 'Failed to load project card')
}

export async function analyzeAsset(payload) {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parseResponse(res, 'Analysis failed')
}

export async function uploadCsv(file, nRegimes = 3, language = 'en') {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_BASE}/upload-csv?n_regimes=${nRegimes}&language=${language}`, {
    method: 'POST',
    body: form,
  })
  return parseResponse(res, 'CSV analysis failed')
}


export async function compareAssetSet(payload) {
  const res = await fetch(`${API_BASE}/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parseResponse(res, 'Comparison failed')
}

export async function fetchQuickstart() {
  const res = await fetch(`${API_BASE}/quickstart`)
  return parseResponse(res, 'Failed to load quickstart')
}
