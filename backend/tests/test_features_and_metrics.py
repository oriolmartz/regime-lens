from __future__ import annotations

import numpy as np
import pandas as pd

from app.services.data_loader import generate_sample_market_data
from app.services.features import engineer_features
from app.services.risk_metrics import expected_persistence_days, max_drawdown, transition_matrix


def test_engineer_features_returns_clean_model_matrix() -> None:
    raw = generate_sample_market_data("QQQ", None, None)
    features, columns, warnings = engineer_features(raw)

    assert len(features) >= 180
    assert "rolling_volatility" in columns
    assert "drawdown" in columns
    assert features[columns].isna().sum().sum() == 0
    assert features["date"].is_monotonic_increasing
    assert isinstance(warnings, list)


def test_transition_matrix_normalizes_observed_rows() -> None:
    states = np.array([0, 0, 1, 1, 2, 2, 2, 0])
    matrix = transition_matrix(states, 3)

    assert matrix.shape == (3, 3)
    assert np.allclose(matrix.sum(axis=1), 1.0)
    assert matrix[0, 0] > 0
    assert matrix[2, 2] > 0


def test_expected_persistence_and_max_drawdown() -> None:
    assert expected_persistence_days(0.8) == 5.000000000000001
    assert expected_persistence_days(1.0) is None
    assert max_drawdown(pd.Series([100, 120, 90, 95])) == -0.25
