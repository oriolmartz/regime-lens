from __future__ import annotations

import numpy as np

from app.services.data_loader import generate_sample_market_data
from app.services.features import engineer_features
from app.services.regime_model import run_regime_model
from app.services.validation import baseline_volatility_regimes, build_model_card, data_quality_report, regime_segments, transition_stability


def _modeled_frame():
    raw = generate_sample_market_data("SPY", None, None)
    features, columns, _ = engineer_features(raw)
    result = run_regime_model(features, columns, n_regimes=3)
    return raw, result.frame, columns


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
    assert 0 <= baseline["stress_agreement"] <= 1
    assert stability["status"] in {"stable", "moderate_drift", "unstable", "insufficient_window"}
    assert segments
    assert "Financial advice" in card["not_intended_for"]


def test_transition_stability_flags_short_windows() -> None:
    raw = generate_sample_market_data("SPY", None, None).head(220)
    features, columns, _ = engineer_features(raw)
    result = run_regime_model(features, columns, n_regimes=3)

    stability = transition_stability(result.frame, n_regimes=3)

    assert stability["status"] == "insufficient_window"
    assert stability["frobenius_distance"] is None
