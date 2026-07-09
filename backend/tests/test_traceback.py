from __future__ import annotations

import numpy as np
import pandas as pd

from app.services.risk_metrics import transition_matrix
from app.services.traceback import build_regime_traceback


def _traceback_fixture() -> tuple[pd.DataFrame, np.ndarray, list[str]]:
    n = 180
    dates = pd.date_range("2024-01-01", periods=n, freq="B")
    states = np.array(([0] * 60) + ([1] * 45) + ([2] * 45) + ([1] * 30))
    labels = {
        0: "Low-volatility expansion",
        1: "Sideways / transition",
        2: "High-volatility stress",
    }
    rng = np.random.default_rng(7)
    frame = pd.DataFrame(
        {
            "date": dates,
            "close": 100 + np.cumsum(rng.normal(0.03, 1.0, n)),
            "log_return": rng.normal(0.0, 0.01, n),
            "rolling_volatility": np.linspace(0.10, 0.38, n),
            "drawdown": np.linspace(-0.01, -0.22, n),
            "momentum_20": np.sin(np.linspace(0, 8, n)) * 0.08,
            "rsi": 50 + np.sin(np.linspace(0, 10, n)) * 20,
            "regime": states,
        }
    )
    frame["regime_label"] = frame["regime"].map(labels)
    probabilities = np.full((n, 3), 0.05)
    probabilities[np.arange(n), states] = 0.90
    frame["regime_probability"] = probabilities[np.arange(n), states]
    frame["posterior_entropy"] = 0.30
    for state in range(3):
        frame[f"state_probability_{state}"] = probabilities[:, state]
    return frame, transition_matrix(states, 3), [labels[i] for i in range(3)]


def test_regime_traceback_exposes_feature_and_baseline_evidence() -> None:
    frame, matrix, labels = _traceback_fixture()
    traceback = build_regime_traceback(frame, matrix, labels)

    assert traceback["name"] == "Regime Traceback"
    assert traceback["current"] is not None
    current = traceback["current"]
    assert current["feature_evidence"]
    assert current["baseline_votes"]
    assert current["state_probabilities"]
    assert current["baseline_total"] == 3
    assert 0 <= current["baseline_agreement_share"] <= 1
    assert "posterior" in traceback["methodology"][2].lower()


def test_traceback_transition_prior_is_null_only_for_initial_point() -> None:
    frame, matrix, labels = _traceback_fixture()
    traceback = build_regime_traceback(frame, matrix, labels)
    non_initial = [point for point in traceback["points"] if point["previous_state"] is not None]

    assert non_initial
    assert all(point["transition_prior"] is not None for point in non_initial)
    assert all(np.isfinite(point["posterior_entropy"] or 0.0) for point in traceback["points"])
