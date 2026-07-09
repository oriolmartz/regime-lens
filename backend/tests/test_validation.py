from __future__ import annotations

import numpy as np
import pandas as pd

from app.services.validation import baseline_volatility_regimes, build_model_card, data_quality_report, regime_segments, transition_stability


def _modeled_frame(n: int = 260):
    dates = pd.date_range("2024-01-01", periods=n, freq="B")
    states = np.array(([0] * (n // 3)) + ([1] * (n // 3)) + ([2] * (n - 2 * (n // 3))))
    labels = {
        0: "Low-volatility expansion",
        1: "Sideways / transition",
        2: "High-volatility stress",
    }
    rng = np.random.default_rng(11)
    raw = pd.DataFrame(
        {
            "date": dates,
            "close": 100 + np.cumsum(rng.normal(0.02, 1.0, n)),
            "volume": 1_000_000,
        }
    )
    modeled = raw.copy()
    modeled["log_return"] = rng.normal(0, 0.01, n)
    modeled["rolling_volatility"] = np.linspace(0.08, 0.42, n)
    modeled["rolling_mean_return"] = rng.normal(0, 0.002, n)
    modeled["drawdown"] = np.linspace(-0.01, -0.25, n)
    modeled["ma_distance"] = rng.normal(0, 0.03, n)
    modeled["momentum_20"] = np.sin(np.linspace(0, 8, n)) * 0.08
    modeled["rsi"] = 50 + np.sin(np.linspace(0, 10, n)) * 18
    modeled["regime"] = states
    modeled["regime_label"] = modeled["regime"].map(labels)
    columns = ["log_return", "rolling_volatility", "rolling_mean_return", "drawdown", "ma_distance", "momentum_20", "rsi"]
    return raw, modeled, columns


def test_validation_layer_returns_interpretable_outputs() -> None:
    raw, modeled, columns = _modeled_frame()

    quality = data_quality_report(raw, source="sample")
    baseline = baseline_volatility_regimes(modeled, n_regimes=3)
    stability = transition_stability(modeled, n_regimes=3)
    segments = regime_segments(modeled)
    card = build_model_card("GaussianHMM", 3, columns)

    assert quality["status"] in {"strong", "review", "fragile"}
    assert "Deterministic sample data" in " ".join(quality["notes"])
    assert baseline["verdict"] in {"aligned", "mixed", "divergent"}
    assert baseline["suite_verdict"] in {"aligned", "mixed", "divergent"}
    assert 0 <= baseline["stress_agreement"] <= 1
    assert 0 <= baseline["suite_mean_agreement"] <= 1
    assert len(baseline["baseline_suite"]) == 3
    assert {item["name"] for item in baseline["baseline_suite"]} >= {"EWMA volatility stress baseline", "Drawdown stress baseline"}
    assert stability["status"] in {"stable", "moderate_drift", "unstable", "insufficient_window"}
    assert segments
    assert "Financial advice" in card["not_intended_for"]


def test_transition_stability_flags_short_windows() -> None:
    _, modeled, _ = _modeled_frame(n=220)

    stability = transition_stability(modeled, n_regimes=3)

    assert stability["status"] == "insufficient_window"
    assert stability["frobenius_distance"] is None
