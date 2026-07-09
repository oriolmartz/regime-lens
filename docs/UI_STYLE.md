# QuantRegimeTracer UI Style

QuantRegimeTracer uses an institutional fintech research aesthetic rather than generic AI/SaaS blue.

## Palette

```txt
Background        #F7F4EF  warm ivory
Surface           #FFFFFF
Surface muted     #FAF8F3
Primary text      #111827
Secondary text    #4B5563
Border            #E4DDD2
Primary navy      #14213D
Analytical accent #2A6F68
Soft accent       #E3F1EE
Positive          #3F7D58
Warning           #B7791F
Danger            #A04444
Neutral           #64748B
```

## Design intent

The product should feel closer to an institutional risk dashboard or asset-management research tool than an AI wrapper.

Use navy for authority, petrol green for analytical actions and muted risk colors for chart semantics. Avoid bright blue glows, neon effects and excessive gradients.

## UI hierarchy

1. **Hero** — positioning, API status, language toggle, export controls and current-regime snapshot.
2. **Control bar** — asset, window, custom dates, number of regimes, live-data toggle and CSV upload.
3. **Dashboard** — key metrics, pipeline panel, price/regime chart, posterior-state-mass/entropy chart, memo, transition matrix and time-series feature charts.
4. **Traceback** — point-level evidence path with features, posterior state mass, entropy, transition prior and baseline votes.
5. **Validation** — baseline agreement, disagreement windows, temporal HMM holdout diagnostics, data quality, diagnostics, regime feature map and model card.
6. **Compare** — multi-asset triage table with explicit risk-review framing.
7. **Case study** — architecture explanation and portfolio positioning.
8. **Export** — Markdown and JSON outputs.
