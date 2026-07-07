# RegimeLens V9 — Git-Ready Edition

RegimeLens is a full-stack time-series regime intelligence demo. It detects hidden market regimes with HMM-style modeling, estimates empirical Markov transition risk, validates the result against a transparent rolling-volatility baseline, compares assets, and generates guarded executive memos through a LangGraph-style workflow.

V9 turns the previous UI-focused build into a cleaner GitHub-ready release:

- Python test suite added with `pytest`
- `node_modules`, cache folders, build artifacts and bytecode removed from the distributable
- Docker frontend build made lockfile-based with `npm ci`
- README and Windows docs sanitized; no personal local paths
- Small UI fixes: reduced hero vertical spacing, no stray Tailwind classes, less generic blue in transition matrix
- Frontend props and API contracts tightened where it mattered most
- Explicit notes on heuristic thresholds and demo limitations

## Positioning

RegimeLens is not a trading bot and does not produce buy/sell signals. The correct framing is:

> From noisy market time series to structured regime intelligence.

It is a risk-review and decision-support demo, built to show time-series modeling, probabilistic reasoning, validation layers, frontend product thinking and guardrailed AI communication.

## Stack

Backend:

- FastAPI
- pandas / numpy
- scikit-learn
- hmmlearn when available, KMeans fallback for demo continuity
- LangGraph workflow pattern
- yfinance optional live-data mode with deterministic fallback
- pytest coverage for data loading, feature engineering, validation, API and risk metrics

Frontend:

- React + Vite
- TypeScript
- Tailwind CSS v3.4.17
- Recharts
- lucide-react
- bilingual UI layer

## Quickstart

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .\.venv\Scriptsctivate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm ci
npm run doctor
npm run typecheck
npm run dev
```

Open:

```txt
http://localhost:5173
```

## Tests

```bash
cd backend
pytest -q
python scripts/smoke_test.py
```

Expected smoke-test output:

```txt
RegimeLens V9 smoke test passed
```

Frontend checks:

```bash
cd frontend
npm ci
npm run typecheck
npm run build
```

## Docker

```bash
docker compose up --build
```

The frontend Dockerfile uses `package-lock.json` and `npm ci` for reproducible installs. `node_modules` is intentionally excluded from Git and Docker build context.

## API highlights

- `GET /health`
- `GET /assets`
- `GET /time-windows`
- `POST /analyze`
- `POST /compare`
- `POST /upload-csv?n_regimes=3&language=es`
- `GET /case-study`
- `GET /project-card`
- `GET /quickstart`

`/analyze` and `/compare` accept `language: "en" | "es"`.

## Demo script

1. Start backend and frontend.
2. Toggle between EN and ES in the navbar.
3. Run SPY or QQQ with deterministic sample data for stable output.
4. Explain current regime, confidence, risk score and stress-transition probability.
5. Open Validation to show HMM-vs-baseline agreement, transition stability and data quality.
6. Open Compare to rank multiple assets by review priority.
7. Export the Markdown report in the selected language.

## Model and validation notes

- Regime labels are inferred from state statistics; they are not ground-truth market labels.
- HMM states can suffer label switching, so labels are derived after fitting instead of assuming state order.
- The rolling-volatility baseline is a transparent sanity check, not a production benchmark.
- Risk bands and drift thresholds are heuristic demo thresholds, not calibrated financial decision rules.
- Transition probabilities are historical estimates over inferred states and can decay quickly under structural change.
- Live-data mode is best effort; deterministic sample fallback keeps the portfolio demo reproducible.
- The app is a portfolio-grade demo, not financial advice.

## GitHub checklist

Before publishing:

- Add 2–3 screenshots or a short GIF under `assets/screenshots/`.
- Commit the clean V9 release as the first public commit if previous zip history is not useful.
- Add a hosted demo link when available.
- Keep technical README and marketing/case-study copy separate.
