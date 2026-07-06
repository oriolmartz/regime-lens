# RegimeLens V6 — Bilingual Memo UX Edition

RegimeLens is a full-stack time-series regime intelligence demo. It detects hidden market regimes with HMM-style modeling, estimates Markov transition risk, validates the result against a transparent rolling-volatility baseline, compares assets, and generates guarded executive memos through a LangGraph workflow.

V6 focuses on **portfolio demo readiness**:

- English / Spanish UI toggle
- Bilingual memo and Markdown report generation
- Compact tabbed LangGraph memo panel
- Reduced vertical memo overload
- Cross-asset comparison from V5 preserved
- Tailwind pinned to v3.4.17 to avoid the Tailwind v4 PostCSS breaking change
- Windows setup docs and doctor script preserved

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

Frontend:

- React + Vite
- Tailwind CSS v3.4.17
- Recharts
- lucide-react
- bilingual UI layer

## Run locally on Windows

Backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend:

```powershell
cd frontend
npm install
npm run doctor
npm run dev
```

Open:

```txt
http://localhost:5173
```

## Portable Node fix

If `npm` is not recognized, add portable Node to your terminal PATH:

```powershell
$NodePath = "C:\Users\oriol\tools\node-v24.18.0-win-x64"
$env:Path = "$NodePath;$env:Path"
node -v
npm -v
```

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

## Smoke test

```powershell
cd backend
$env:PYTHONPATH="."
python scripts/smoke_test.py
```

Expected output:

```txt
RegimeLens V6 smoke test passed
```

## Demo script

1. Start backend and frontend.
2. Toggle between EN and ES in the navbar.
3. Run SPY or QQQ with deterministic sample data.
4. Explain current regime, confidence, risk score and stress transition.
5. Open the compact LangGraph memo and switch between Summary, Evidence, Review and Limits.
6. Open Compare to rank multiple assets by review priority.
7. Export the Markdown report in the selected language.

## Limitations

- Regimes are inferred, not ground truth.
- Transition probabilities are historical estimates over inferred states.
- The rolling-volatility baseline is a sanity check, not a production model.
- The app is a portfolio-grade demo, not financial advice.
