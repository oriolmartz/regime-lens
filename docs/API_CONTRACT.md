# RegimeLens V6 API Contract

Base URL: `http://localhost:8000`

## GET /health

Returns API status and version.

```json
{"status":"ok","service":"RegimeLens API","version":"0.6.0"}
```

## GET /assets

Returns supported demo assets.

## GET /time-windows

Returns supported analysis windows: `6M`, `1Y`, `3Y`, `5Y`, `MAX`.

## POST /analyze

Runs single-asset regime analysis.

Request:

```json
{
  "asset": "SPY",
  "interval": "5Y",
  "n_regimes": 3,
  "prefer_live_data": false
}
```

Response includes:

- `current_regime`
- `risk_metrics`
- `regime_stats`
- `transition_matrix`
- `time_series`
- `baseline`
- `stability`
- `data_quality`
- `model_card`
- `memo`
- `report_markdown`

## POST /compare

Runs cross-asset regime comparison for up to 8 assets.

Request:

```json
{
  "assets": ["SPY", "QQQ", "BTC-USD"],
  "interval": "5Y",
  "n_regimes": 3,
  "prefer_live_data": false
}
```

Response:

```json
{
  "api_version": "0.6.0",
  "interval": "5Y",
  "assets_requested": ["SPY", "QQQ", "BTC-USD"],
  "summaries": [
    {
      "asset": "BTC-USD",
      "source": "sample",
      "current_regime": "High-volatility stress",
      "confidence": 0.73,
      "risk_score": 0.68,
      "risk_band": "elevated",
      "stress_transition_probability": 0.54,
      "stay_probability": 0.54,
      "latest_drawdown": -0.23,
      "annualized_volatility": 0.41,
      "baseline_agreement": 0.70,
      "baseline_verdict": "mixed",
      "data_quality_status": "strong",
      "warnings": []
    }
  ],
  "highest_risk_asset": "BTC-USD",
  "lowest_risk_asset": "SPY",
  "average_risk_score": 0.42,
  "portfolio_memo": {
    "summary": "3 assets analyzed. Highest current review priority: BTC-USD. Lowest current risk score: SPY.",
    "review_notes": []
  }
}
```

Important: this endpoint is for portfolio review triage only. It is not optimization and does not issue buy/sell advice.

## POST /upload-csv

Uploads a CSV with required columns:

- `date`
- `close`

Optional:

- `volume`

Query parameter:

- `n_regimes`: integer between 2 and 5.

## GET /project-card

Returns portfolio copy and stack tags.

## GET /case-study

Returns an in-app case study summary.

## GET /quickstart

Returns setup commands and common Windows fixes.

## GET /demo-script

Returns a 60-90 second demo script.

## GET /model-card

Returns intended use, non-use, assumptions, outputs and failure modes.

## GET /sample-csv

Returns sample CSV data for upload testing.


## V6 bilingual parameter

`POST /analyze` and `POST /compare` accept `language: "en" | "es"`. `POST /upload-csv` accepts `language` as a query parameter.
