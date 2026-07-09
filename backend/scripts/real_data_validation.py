from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"
sys.path.insert(0, str(BACKEND))

from app.services.data_loader import load_market_data, resolve_window
from app.services.features import engineer_features
from app.services.model_evaluation import temporal_hmm_evaluation
from app.services.regime_model import run_regime_model
from app.services.validation import baseline_volatility_regimes, data_quality_report, transition_stability
from app.utils.serialization import clean_number


def deep_clean(obj):
    if isinstance(obj, dict):
        return {k: deep_clean(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [deep_clean(v) for v in obj]
    return clean_number(obj)


def validate_asset(asset: str, interval: str, n_regimes: int, data_mode: str = "real", force_refresh: bool = False) -> dict:
    start, end, normalized = resolve_window(None, None, interval)
    loaded = load_market_data(asset, start=start, end=end, interval=normalized, data_mode=data_mode, force_refresh=force_refresh)
    features, feature_cols, feature_warnings = engineer_features(loaded.frame)
    result = run_regime_model(features, feature_cols, n_regimes=n_regimes)
    evaluation = temporal_hmm_evaluation(features, feature_cols, selected_regimes=n_regimes)
    baseline = baseline_volatility_regimes(result.frame, n_regimes)
    stability = transition_stability(result.frame, n_regimes)
    quality = data_quality_report(loaded.frame, loaded.source, loaded.cache_hit)
    return deep_clean(
        {
            "asset": asset,
            "source": loaded.source,
            "data_mode": data_mode,
            "is_real_data": loaded.is_real_data,
            "cache_hit": loaded.cache_hit,
            "warning": loaded.warning,
            "feature_warnings": feature_warnings,
            "interval": normalized,
            "observations": len(result.frame),
            "data_start": result.diagnostics.get("data_start"),
            "data_end": result.diagnostics.get("data_end"),
            "model_type": result.diagnostics.get("model_type"),
            "current_regime": result.current_regime,
            "recommended_n_regimes": evaluation.get("recommended_n_regimes"),
            "selected_matches_recommendation": evaluation.get("selected_matches_recommendation"),
            "model_evaluation": evaluation,
            "baseline_suite": baseline.get("baseline_suite"),
            "baseline_suite_mean_agreement": baseline.get("suite_mean_agreement"),
            "transition_stability": stability,
            "data_quality": quality,
        }
    )


def markdown_report(results: list[dict]) -> str:
    lines = [
        "# QuantRegimeTracer real-data validation report",
        "",
        "This report is produced by `python backend/scripts/real_data_validation.py`. In default `real` mode it requires cache/yfinance data. Use `--data-mode auto` only when you explicitly want deterministic sample fallback recorded in the report.",
        "",
        "| Asset | Mode | Source | Real-backed | Model | Selected→Recommended k | Baseline-suite agreement | Multi-seed stability | Notes |",
        "|---|---:|---:|---:|---:|---:|---:|---:|---|",
    ]
    for row in results:
        evaluation = row.get("model_evaluation") or {}
        stability = evaluation.get("assignment_stability") or {}
        notes = []
        if row.get("warning"):
            notes.append("fallback warning")
        if evaluation.get("status") != "ok":
            notes.append(f"eval {evaluation.get('status')}")
        source = row.get("source", "—")
        lines.append(
            f"| {row.get('asset')} | {row.get('data_mode', '—')} | {source} | {row.get('is_real_data', False)} | {row.get('model_type')} | "
            f"{evaluation.get('selected_regimes', '—')}→{evaluation.get('recommended_n_regimes', '—')} | "
            f"{(row.get('baseline_suite_mean_agreement') or 0):.1%} | "
            f"{stability.get('verdict', stability.get('status', '—'))} | "
            f"{', '.join(notes) if notes else 'ok'} |"
        )
    lines.extend(
        [
            "",
            "## Interpretation",
            "- This is model validation, not trading validation.",
            "- Real-data credibility comes from `real-backed=True` and `source` in `yfinance` / `cache:yfinance`.",
            "- A mismatch between selected and recommended k is not hidden; it is a review flag.",
            "- Multi-seed instability means the HMM partition should be treated cautiously even if the chart looks clean.",
        ]
    )
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run QuantRegimeTracer validation on real market data when yfinance is available.")
    parser.add_argument("--assets", nargs="+", default=["SPY", "QQQ", "BTC-USD", "GLD", "TLT"], help="Ticker symbols to validate.")
    parser.add_argument("--interval", default="5Y", choices=["6M", "1Y", "3Y", "5Y", "MAX"])
    parser.add_argument("--regimes", type=int, default=3)
    parser.add_argument("--data-mode", default="real", choices=["real", "auto", "sample"], help="real requires cache/yfinance; auto allows explicit sample fallback; sample is offline only.")
    parser.add_argument("--force-refresh", action="store_true", help="Bypass local cache and request fresh provider data.")
    parser.add_argument("--out", default="reports/real_data_validation.json")
    args = parser.parse_args()

    results = []
    for asset in args.assets:
        try:
            results.append(validate_asset(asset, args.interval, args.regimes, data_mode=args.data_mode, force_refresh=args.force_refresh))
        except Exception as exc:
            results.append({"asset": asset, "data_mode": args.data_mode, "source": "error", "is_real_data": False, "error": str(exc)})
    out = ROOT / args.out
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({"results": results}, indent=2), encoding="utf-8")
    md = out.with_suffix(".md")
    md.write_text(markdown_report(results), encoding="utf-8")
    print(f"Wrote {out.relative_to(ROOT)} and {md.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
