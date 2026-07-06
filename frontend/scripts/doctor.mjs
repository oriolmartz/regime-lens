import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  } catch {
    return null
  }
}

const viteBin = join('node_modules', '.bin', process.platform === 'win32' ? 'vite.cmd' : 'vite')
const checks = []
const nodeVersion = run('node -v')
const npmVersion = run('npm -v')
checks.push(['Node.js', nodeVersion || 'not found', Boolean(nodeVersion)])
checks.push(['npm', npmVersion || 'not found', Boolean(npmVersion)])
checks.push(['node_modules', existsSync('node_modules') ? 'present' : 'missing', existsSync('node_modules')])
checks.push(['Vite binary', existsSync(viteBin) ? 'present' : 'missing', existsSync(viteBin)])
checks.push(['Tailwind config', existsSync('tailwind.config.js') ? 'present' : 'missing', existsSync('tailwind.config.js')])
checks.push(['PostCSS config', existsSync('postcss.config.js') ? 'present' : 'missing', existsSync('postcss.config.js')])

console.log('\nRegimeLens frontend doctor\n')
for (const [name, value, ok] of checks) {
  console.log(`${ok ? '✓' : '×'} ${name}: ${value}`)
}
console.log('\nIf Vite is missing, run: npm install')
console.log('If npm install fails with ENOSPC, free disk space and run: npm cache clean --force\n')
