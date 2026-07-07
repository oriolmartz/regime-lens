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

const bin = (name) => join('node_modules', '.bin', process.platform === 'win32' ? `${name}.cmd` : name)
const checks = []
const nodeVersion = run('node -v')
const npmVersion = run('npm -v')
checks.push(['Node.js', nodeVersion || 'not found', Boolean(nodeVersion)])
checks.push(['npm', npmVersion || 'not found', Boolean(npmVersion)])
checks.push(['node_modules', existsSync('node_modules') ? 'present' : 'missing', existsSync('node_modules')])
checks.push(['Vite binary', existsSync(bin('vite')) ? 'present' : 'missing', existsSync(bin('vite'))])
checks.push(['TypeScript binary', existsSync(bin('tsc')) ? 'present' : 'missing', existsSync(bin('tsc'))])
checks.push(['tsconfig.json', existsSync('tsconfig.json') ? 'present' : 'missing', existsSync('tsconfig.json')])
checks.push(['Tailwind config', existsSync('tailwind.config.js') ? 'present' : 'missing', existsSync('tailwind.config.js')])
checks.push(['PostCSS config', existsSync('postcss.config.js') ? 'present' : 'missing', existsSync('postcss.config.js')])
checks.push(['TypeScript App', existsSync(join('src', 'App.tsx')) ? 'present' : 'missing', existsSync(join('src', 'App.tsx'))])

console.log('\nRegimeLens V9 frontend doctor\n')
for (const [name, value, ok] of checks) {
  console.log(`${ok ? '✓' : '×'} ${name}: ${value}`)
}
console.log('\nIf Vite/TypeScript is missing, run: npm ci')
console.log('If npm install fails with ENOSPC, free disk space and run: npm cache clean --force')
console.log('V9 uses TypeScript + React, keeps Tailwind pinned to 3.4.17, and applies the institutional fintech palette.\n')
