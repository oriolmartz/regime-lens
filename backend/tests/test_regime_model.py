from __future__ import annotations

import numpy as np

from app.services.data_loader import generate_sample_market_data
from app.services.features import engineer_features
from app.services.model_evaluation import hmm_parameter_count, normalized_entropy, temporal_hmm_evaluation
from app.services.regime_model import _label_regimes, run_regime_model


def test_regime_model_outputs_probabilities_entropy_and_labels() -> None:
    raw = generate_sample_market_data("SPY", None, None)
    features, columns, _ = engineer_features(raw)

    result = run_regime_model(features, columns, n_regimes=3)

    assert result.frame["regime"].nunique() >= 2
    assert len(result.regime_stats) == 3
    assert result.transition_matrix.shape == (3, 3)
    assert np.allclose(result.transition_matrix.sum(axis=1), 1.0)
    assert "posterior_entropy" in result.frame.columns
    assert result.frame["posterior_entropy"].between(0, 1).all()
    assert 0 <= result.current_regime["confidence"] <= 1
    assert 0 <= result.current_regime["posterior_entropy"] <= 1
    assert result.diagnostics["assignment_style"] in {"smoothed_hmm_posterior", "hard_cluster_proxy"}
    assert any("stress" in label.lower() for label in result.transition_labels)


def test_normalized_entropy_boundary_cases() -> None:
    assert normalized_entropy([1.0, 0.0, 0.0]) == 0.0
    assert normalized_entropy([0.0, 0.0, 0.0]) == 0.0
    assert 0.99 <= normalized_entropy([1 / 3, 1 / 3, 1 / 3]) <= 1.0


def test_hmm_parameter_count_increases_with_states() -> None:
    assert hmm_parameter_count(3, 4) > hmm_parameter_count(2, 4)
    assert hmm_parameter_count(3, 5) > hmm_parameter_count(3, 4)


def test_temporal_hmm_evaluation_is_graceful_without_runtime_hmm() -> None:
    raw = generate_sample_market_data("QQQ", None, None)
    features, columns, _ = engineer_features(raw)

    evaluation = temporal_hmm_evaluation(features, columns, selected_regimes=3, candidate_regimes=[2, 3], n_iter=10)

    assert evaluation["status"] in {"ok", "unavailable", "failed", "insufficient_window"}
    assert evaluation["selected_regimes"] == 3
    assert "recommended_n_regimes" in evaluation
    assert "selected_matches_recommendation" in evaluation
    assert "assignment_stability" in evaluation
    assert evaluation["assignment_stability"]["status"] in {"ok", "unavailable", "failed", "insufficient_window"}
    if evaluation["status"] == "ok":
        assert evaluation["candidates"]
        assert "best_bic_regimes" in evaluation
        assert "selected_train_test_loglik_gap" in evaluation
        assert evaluation["recommended_n_regimes"] in {2, 3, 4, 5}


def test_semantic_labels_reserve_low_volatility_for_the_lowest_vol_positive_state() -> None:
    n = 90
    states = np.array(([0] * 30) + ([1] * 30) + ([2] * 30))
    frame = generate_sample_market_data("SPY", None, None).head(n).copy()
    frame["log_return"] = np.r_[np.full(30, 0.0040), np.full(30, -0.0030), np.full(30, 0.0007)]
    frame["rolling_volatility"] = np.r_[np.full(30, 0.20), np.full(30, 0.32), np.full(30, 0.10)]
    frame["drawdown"] = np.r_[np.full(30, -0.03), np.full(30, -0.14), np.full(30, -0.01)]
    frame["momentum_20"] = np.r_[np.full(30, 0.08), np.full(30, -0.06), np.full(30, 0.02)]

    labels = _label_regimes(frame, states, 3)

    assert labels[1] == "High-volatility stress"
    assert labels[2] == "Low-volatility expansion"
    assert labels[0] == "High-momentum expansion"
