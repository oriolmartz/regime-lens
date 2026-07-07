# RegimeLens — Institutional UI Edition

## What changed in V9

- Reworked the UI color system from generic AI-blue to an institutional fintech palette.
- Added warm ivory backgrounds, deep navy authority colors and petrol-green analytical accents.
- Muted risk colors for expansion, transition and stress regimes to make charts feel more like research tooling than a crypto dashboard.
- Reduced bright blue Tailwind defaults across cards, badges, controls and chart strokes.
- Preserved the V9 TypeScript frontend, bilingual UX and FastAPI/HMM backend.

## One-line positioning

**RegimeLens turns noisy market time series into structured regime intelligence through HMMs, Markov transition analysis, validation baselines and guarded LangGraph-style memos.**

## What V9 adds

V9 does not add uncontrolled model complexity. It upgrades the product/code quality layer:

- React frontend migrated from JavaScript to TypeScript
- Shared frontend contracts for analysis, comparison, memos and project-card payloads
- Typed API client for FastAPI responses
- Build pipeline now runs `tsc -b && vite build`
- Vite config migrated to TypeScript
- Tailwind remains pinned to v3.4.17 for stable Windows setup
- Bilingual EN/ES memo UX from V6 preserved
- Cross-asset comparison from V5 preserved

## Problem

Market dashboards often show price, volatility and indicators without explaining regime uncertainty. Simple volatility thresholds are transparent but shallow; HMMs capture latent state structure but can become opaque. RegimeLens combines both: infer hidden regimes, compare against a simple baseline, and generate a guarded memo that explains what the model sees and what it cannot claim.

## Architecture

```txt
Market data / CSV
↓
Feature engineering: returns, volatility, drawdown, momentum
↓
HMM-style regime detection
↓
Markov transition matrix
↓
Validation layer: baseline agreement, stability, data quality
↓
LangGraph-style memo workflow
↓
React + TypeScript dashboard
```

## Why TypeScript matters here

The frontend consumes nested, high-variance outputs: regime stats, transition matrices, memo sections, comparison rows and model-card metadata. TypeScript makes those contracts explicit and improves maintainability. The project now communicates a cleaner full-stack split:

- **Python**: modeling, analysis, API, memo generation
- **TypeScript**: product UI, API contracts, interaction layer

## Portfolio value

RegimeLens demonstrates:

- time-series modeling
- probabilistic regime reasoning
- Markov transition analysis
- validation against simple baselines
- bilingual executive memo UX
- frontend product thinking
- typed full-stack API boundaries
- risk communication with guardrails

## Limitations

- Regimes are inferred states, not ground-truth labels.
- Transition probabilities are historical estimates over inferred state paths.
- The app does not provide buy/sell recommendations.
- The HMM fallback exists for demo continuity, not production-grade modeling.
