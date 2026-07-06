# RegimeLens — Bilingual Memo UX Edition

## One-line positioning

RegimeLens turns noisy market time series into structured regime intelligence, with HMM-style modeling, Markov transition analysis, validation checks and bilingual executive memos.

## What V6 adds

V6 improves the demo layer rather than adding uncontrolled model complexity:

- English / Spanish product toggle
- Bilingual backend memo and Markdown report generation
- Compact tabbed LangGraph memo panel
- Better memo readability for recruiter/interview demos
- Cross-asset comparison preserved from V5
- Tailwind dependency pinning preserved to avoid setup breakage

## Why this matters

The project is designed to avoid the weak version of financial AI demos: prediction hype, buy/sell signals and overloaded dashboards. Instead, it shows a more serious workflow:

1. analyze a time series,
2. infer regimes,
3. estimate transition risk,
4. compare against a baseline,
5. generate a guarded memo,
6. export the result for review.

## Architecture

```txt
React / Tailwind UI
  ├─ Dashboard
  ├─ Validation
  ├─ Compare
  ├─ Compact LangGraph Memo
  └─ Export
        ↓
FastAPI backend
        ↓
Feature engineering
        ↓
HMM / KMeans fallback regime engine
        ↓
Markov transition matrix
        ↓
Validation layer
        ↓
LangGraph memo workflow
        ↓
Bilingual Markdown / JSON outputs
```

## Interview talking points

- I did not frame this as a trading bot.
- I added a simple baseline because HMM output should not be treated as magic.
- I added guardrails because financial-facing AI outputs need careful language.
- I made the memo compact because product demos fail when outputs are visually overwhelming.
- I added ES/EN because international product surfaces should separate model logic from presentation language.
