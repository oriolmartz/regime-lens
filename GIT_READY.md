# Git-ready commands

Recommended first public commit:

```bash
git init
git add .
git commit -m "Release RegimeLens V9 git-ready portfolio build"
```

Validation commands before pushing:

```bash
cd backend
pytest -q
PYTHONPATH=. python scripts/smoke_test.py

cd ../frontend
npm ci
npm run typecheck
npm run build
npm audit --omit=dev
```

Suggested GitHub repo description:

> Full-stack market regime intelligence demo with FastAPI, HMM/KMeans fallback, Markov transitions, validation diagnostics, React/TypeScript UI and guarded executive memos.
