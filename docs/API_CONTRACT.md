# RegimeLens V9 API Contract

Backend version: `0.9.0`  
Frontend: React + TypeScript + Vite

## Health

```http
GET /health
```

```json
{"status":"ok","service":"RegimeLens API","version":"0.9.0"}
```

## Assets

```http
GET /assets
```

```json
{"assets":["SPY","QQQ","BTC-USD","ETH-USD","AAPL","MSFT","NVDA","META"]}
```

## Analyze

```http
POST /analyze
```

Request:

```json
{
  "asset": "SPY",
  "interval": "5Y",
  "n_regimes": 3,
  "prefer_live_data": false,
  "language": "en"
}
```

Response includes:

```json
{
  "api_version": "0.9.0",
  "asset": "SPY",
  "source": "sample",
  "current_regime": {
    "label": "High-volatility stress",
    "confidence": 0.74,
    "risk_score": 0.68,
    "stay_probability": 0.61,
    "stress_transition_probability": 0.27
  },
  "transition_matrix": [[0.82,0.14,0.04]],
  "time_series": [],
  "memo": {},
  "report_markdown": "..."
}
```

## Compare

```http
POST /compare
```

Request:

```json
{
  "assets": ["SPY", "QQQ", "BTC-USD"],
  "interval": "3Y",
  "n_regimes": 3,
  "prefer_live_data": false,
  "language": "es"
}
```

Response includes ranked asset summaries, current regime labels, risk scores, baseline agreement and a comparison memo.

## CSV upload

```http
POST /upload-csv?n_regimes=3&language=es
```

CSV requires:

```txt
date,close
```

Optional:

```txt
volume
```

## Frontend TypeScript contracts

V9 adds typed frontend contracts in:

```txt
frontend/src/lib/types.ts
frontend/src/lib/api.ts
```

These types cover analysis payloads, comparison payloads, memo sections, current regime objects and portfolio project-card metadata.
