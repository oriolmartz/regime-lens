import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const required = [
  'src/App.tsx',
  'src/components/PriceRegimeChart.tsx',
  'src/components/RegimeConfidenceChart.tsx',
  'src/components/RegimeSummaryMetrics.tsx',
  'src/components/ModelEvaluationPanel.tsx',
  'src/lib/types.ts',
  'src/lib/api.ts',
]

const missing = required.filter((file) => !existsSync(join(root, file)))
if (missing.length) {
  console.error(`Missing UI files: ${missing.join(', ')}`)
  process.exit(1)
}

const app = readFileSync(join(root, 'src/App.tsx'), 'utf8')
const types = readFileSync(join(root, 'src/lib/types.ts'), 'utf8')
const confidence = readFileSync(join(root, 'src/components/RegimeConfidenceChart.tsx'), 'utf8')

const checks = [
  ['App renders posterior state mass chart', app.includes('RegimeConfidenceChart')],
  ['App renders temporal model evaluation panel', app.includes('ModelEvaluationPanel')],
  ['Types expose posterior entropy', types.includes('posterior_entropy')],
  ['Types expose model evaluation', types.includes('model_evaluation')],
  ['Confidence chart exposes entropy uncertainty', confidence.includes('posterior_entropy') && confidence.includes('Entropy')],
]

const failed = checks.filter(([, ok]) => !ok)
if (failed.length) {
  for (const [name] of failed) console.error(`UI smoke failed: ${name}`)
  process.exit(1)
}

console.log('QuantRegimeTracer UI smoke test passed')
