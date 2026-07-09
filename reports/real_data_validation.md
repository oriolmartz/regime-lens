# QuantRegimeTracer real-data validation report

This report is produced by `python backend/scripts/real_data_validation.py` using `data_mode=real`. In this mode the run requires cache/yfinance data and does not silently fall back to deterministic sample data.

| Asset | Mode | Source | Real-backed | Model | Selected→Recommended k | Baseline-suite agreement | Multi-seed stability | Mean ARI | Evaluation verdict | Train/test LL gap | Data quality |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SPY | real | yfinance | True | GaussianHMM | 3→5 | 72.3% | stable | 0.936 | healthy | 0.233 | strong |
| QQQ | real | yfinance | True | GaussianHMM | 3→5 | 82.5% | moderate | 0.601 | watch | 0.653 | strong |
| BTC-USD | real | yfinance | True | GaussianHMM | 3→5 | 68.9% | stable | 1.000 | healthy | -0.306 | strong |
| GLD | real | yfinance | True | GaussianHMM | 3→5 | 77.0% | stable | 0.859 | overfit_risk | 46.030 | strong |
| TLT | real | yfinance | True | GaussianHMM | 3→5 | 76.9% | stable | 0.898 | healthy | 0.069 | strong |

## Summary

The validation run confirms that the pipeline executed on real yfinance-backed market data for SPY, QQQ, BTC-USD, GLD and TLT. Each asset was analyzed with `GaussianHMM`, baseline-suite comparison, chronological train/test diagnostics, multi-seed stability review and data-quality reporting.

This report is **model validation**, not trading validation. It evaluates whether the regime-inference workflow is internally consistent, source-aware and diagnostically honest. It does not evaluate trading profitability, execution, slippage or forecast edge.

## Main findings

### 1. Systematic selected-vs-recommended regime-count mismatch

The interactive workflow currently uses `k=3` by default because three regimes are easier to inspect visually and semantically: expansion-like, transition-like and stress-like states.

However, the model-selection layer recommended `k=5` by BIC across all five evaluated assets. This is not hidden. It is a review flag: the data may support a finer decomposition than the default UI setting. For portfolio/demo use, `k=3` is an interpretability choice. For stricter research, the `k=5` diagnostics should be inspected.

### 2. GLD overfit-risk case

GLD produced an `overfit_risk` verdict in temporal holdout diagnostics. Its selected train/test log-likelihood gap was much larger than the other assets, meaning the model fit the training window far better than the held-out window.

This is a useful stress test for the product: the system still produces a regime label, but it also exposes that the temporal generalization is weak. A clean-looking regime chart should not override this warning.

### 3. QQQ moderate multi-seed stability

QQQ produced only `moderate` multi-seed assignment stability, with a mean Adjusted Rand Index of 0.601. This means different HMM initializations can produce meaningfully different partitions. The QQQ regime path should therefore be interpreted with more caution than assets with `stable` assignment behavior.

### 4. Near one-hot posterior mass is not forecast confidence

Several assets show posterior state mass close to 1.0 for the latest observation. This should be read as strong assignment of the latest observation to one latent state under the fitted HMM, not as market forecast certainty. QuantRegimeTracer intentionally reports posterior entropy, evidence strength and validation diagnostics separately from state assignment strength.

## Asset-level notes

### SPY

- Data: `real` mode, `yfinance` source, real-backed `True`.
- Model: `GaussianHMM` with selected `k=3` and recommended `k=5`.
- Evaluation verdict: `healthy`.
- Multi-seed stability: `stable`; mean ARI `0.936`; min ARI `0.893`.
- Baseline-suite mean agreement: `72.3%`.
- Latest regime: `Sideways / transition`; risk score `21.0%`; posterior entropy `0.000082`.

### QQQ

- Data: `real` mode, `yfinance` source, real-backed `True`.
- Model: `GaussianHMM` with selected `k=3` and recommended `k=5`.
- Evaluation verdict: `watch`.
- Multi-seed stability: `moderate`; mean ARI `0.601`; min ARI `0.318`.
- Baseline-suite mean agreement: `82.5%`.
- Latest regime: `High-volatility stress`; risk score `89.5%`; posterior entropy `0.002952`.

### BTC-USD

- Data: `real` mode, `yfinance` source, real-backed `True`.
- Model: `GaussianHMM` with selected `k=3` and recommended `k=5`.
- Evaluation verdict: `healthy`.
- Multi-seed stability: `stable`; mean ARI `1.000`; min ARI `1.000`.
- Baseline-suite mean agreement: `68.9%`.
- Latest regime: `Sideways / transition`; risk score `50.4%`; posterior entropy `0.000031`.

### GLD

- Data: `real` mode, `yfinance` source, real-backed `True`.
- Model: `GaussianHMM` with selected `k=3` and recommended `k=5`.
- Evaluation verdict: `overfit_risk`.
- Multi-seed stability: `stable`; mean ARI `0.859`; min ARI `0.745`.
- Baseline-suite mean agreement: `77.0%`.
- Latest regime: `High-volatility stress`; risk score `99.9%`; posterior entropy `0.000000`.

### TLT

- Data: `real` mode, `yfinance` source, real-backed `True`.
- Model: `GaussianHMM` with selected `k=3` and recommended `k=5`.
- Evaluation verdict: `healthy`.
- Multi-seed stability: `stable`; mean ARI `0.898`; min ARI `0.821`.
- Baseline-suite mean agreement: `76.9%`.
- Latest regime: `Low-volatility expansion`; risk score `28.6%`; posterior entropy `0.000005`.

## Interpretation guardrails

- `real-backed=True` and `source in {yfinance, cache:yfinance}` are required before treating a run as real-market-backed.
- `k=3` is the current interpretability default; `k=5` is the BIC-recommended review candidate in this validation bundle.
- Overfit-risk, watch and moderate-stability verdicts are not errors to hide; they are review signals.
- Baseline agreement is a sanity check, not proof of trading edge.
- Markov transition probabilities are historical diagnostics over the inferred state path, not guaranteed forecasts.
- Posterior state mass close to 1.0 is not market prediction confidence.
