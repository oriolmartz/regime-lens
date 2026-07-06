from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

from app.services.risk_metrics import expected_persistence_days, transition_matrix


@dataclass
class RegimeResult:
    frame: pd.DataFrame
    regime_stats: list[dict[str, Any]]
    transition_matrix: np.ndarray
    transition_labels: list[str]
    current_regime: dict[str, Any]
    diagnostics: dict[str, Any]
    warnings: list[str]


def _fit_hmm(features: np.ndarray, n_regimes: int) -> tuple[np.ndarray, np.ndarray | None, str, list[str]]:
    warnings: list[str] = []
    try:
        from hmmlearn.hmm import GaussianHMM

        model = GaussianHMM(
            n_components=n_regimes,
            covariance_type="full",
            n_iter=500,
            random_state=42,
            min_covar=1e-4,
        )
        model.fit(features)
        states = model.predict(features)
        try:
            probabilities = model.predict_proba(features)
        except Exception:
            probabilities = None
        return states, probabilities, "GaussianHMM", warnings
    except Exception as exc:
        warnings.append(f"HMM fit failed; used KMeans fallback for demo continuity. Reason: {exc}")
        labels = KMeans(n_clusters=n_regimes, random_state=42, n_init=10).fit_predict(features)
        probabilities = np.zeros((len(labels), n_regimes))
        probabilities[np.arange(len(labels)), labels] = 1.0
        return labels, probabilities, "KMeans fallback", warnings


def _label_regimes(df: pd.DataFrame, states: np.ndarray, n_regimes: int) -> dict[int, str]:
    tmp = df.copy()
    tmp["regime"] = states
    grouped = tmp.groupby("regime").agg(
        mean_return=("log_return", "mean"),
        annualized_volatility=("rolling_volatility", "mean"),
        mean_drawdown=("drawdown", "mean"),
        mean_momentum=("momentum_20", "mean"),
    )

    stress_score = (
        grouped["annualized_volatility"].rank(pct=True)
        + (-grouped["mean_return"]).rank(pct=True)
        + (-grouped["mean_drawdown"]).rank(pct=True)
    )
    expansion_score = (
        grouped["mean_return"].rank(pct=True)
        + grouped["mean_momentum"].rank(pct=True)
        + (-grouped["annualized_volatility"]).rank(pct=True)
    )

    stress_state = int(stress_score.idxmax())
    remaining = [state for state in range(n_regimes) if state != stress_state]
    expansion_state = int(expansion_score.loc[remaining].idxmax()) if remaining else stress_state

    labels: dict[int, str] = {}
    for state in range(n_regimes):
        if state == stress_state:
            labels[state] = "High-volatility stress"
        elif state == expansion_state:
            labels[state] = "Low-volatility expansion"
        else:
            labels[state] = "Sideways / transition"
    return labels


def _confidence_status(confidence: float, observations: int, model_type: str) -> str:
    if model_type != "GaussianHMM":
        return "fallback"
    if observations < 220 or confidence < 0.45:
        return "fragile"
    if confidence < 0.65:
        return "moderate"
    return "strong"


def _risk_score(stress_transition: float, vol: float, drawdown: float, label: str) -> float:
    label_boost = 0.18 if "stress" in label.lower() else 0.05 if "transition" in label.lower() else 0.0
    score = 0.45 * min(stress_transition / 0.45, 1.0) + 0.35 * min(vol / 0.45, 1.0) + 0.20 * min(abs(drawdown) / 0.35, 1.0) + label_boost
    return float(min(score, 1.0))


def run_regime_model(df: pd.DataFrame, feature_cols: list[str], n_regimes: int = 3) -> RegimeResult:
    warnings: list[str] = []
    if len(df) < max(180, n_regimes * 60):
        warnings.append("Limited data length for HMM; regime inference may be fragile.")

    scaler = StandardScaler()
    X = scaler.fit_transform(df[feature_cols].astype(float))
    states, probabilities, model_type, fit_warnings = _fit_hmm(X, n_regimes)
    warnings.extend(fit_warnings)

    labels = _label_regimes(df, states, n_regimes)
    mat = transition_matrix(states, n_regimes)

    out = df.copy()
    out["regime"] = states
    out["regime_label"] = out["regime"].map(labels)
    if probabilities is not None:
        current_probs = probabilities[-1]
        out["regime_probability"] = [float(probabilities[i, int(states[i])]) for i in range(len(out))]
    else:
        current_probs = np.zeros(n_regimes)
        current_probs[int(states[-1])] = 1.0
        out["regime_probability"] = np.nan

    stats: list[dict[str, Any]] = []
    for state in range(n_regimes):
        part = out[out["regime"] == state]
        latest_probability = float(current_probs[state]) if len(current_probs) > state else 0.0
        stats.append(
            {
                "regime": int(state),
                "label": labels[state],
                "observations": int(len(part)),
                "mean_return": float(part["log_return"].mean() * 252) if len(part) else 0.0,
                "annualized_volatility": float(part["rolling_volatility"].mean()) if len(part) else 0.0,
                "mean_drawdown": float(part["drawdown"].mean()) if len(part) else 0.0,
                "mean_momentum": float(part["momentum_20"].mean()) if len(part) else 0.0,
                "latest_probability": latest_probability,
            }
        )

    current_state = int(states[-1])
    stress_states = [s for s, label in labels.items() if "stress" in label.lower()]
    stress_state = stress_states[0] if stress_states else current_state
    stay_prob = float(mat[current_state, current_state]) if mat.size else 0.0
    stress_transition = float(mat[current_state, stress_state]) if stress_state != current_state else stay_prob
    persistence = expected_persistence_days(stay_prob)
    latest_vol = float(out["rolling_volatility"].iloc[-1])
    latest_drawdown = float(out["drawdown"].iloc[-1])
    confidence = float(current_probs[current_state])
    risk_score = _risk_score(stress_transition, latest_vol, latest_drawdown, labels[current_state])

    current_regime = {
        "state": current_state,
        "label": labels[current_state],
        "confidence": confidence,
        "stay_probability": stay_prob,
        "stress_transition_probability": stress_transition,
        "expected_persistence_days": persistence,
        "risk_score": risk_score,
    }

    separability = None
    if len(set(states)) > 1 and len(X) > n_regimes:
        try:
            separability = float(silhouette_score(X, states))
        except Exception:
            separability = None

    diagnostics = {
        "model_type": model_type,
        "n_observations": int(len(out)),
        "n_features": int(len(feature_cols)),
        "n_regimes": int(n_regimes),
        "feature_columns": feature_cols,
        "data_start": out["date"].iloc[0].strftime("%Y-%m-%d"),
        "data_end": out["date"].iloc[-1].strftime("%Y-%m-%d"),
        "confidence_status": _confidence_status(confidence, len(out), model_type),
        "separability_score": separability,
        "notes": [
            "Regime labels are derived from inferred state statistics, not manually assigned classes.",
            "Transition probabilities are empirical estimates over the inferred regime path.",
        ],
    }

    return RegimeResult(
        frame=out,
        regime_stats=stats,
        transition_matrix=mat,
        transition_labels=[labels[i] for i in range(n_regimes)],
        current_regime=current_regime,
        diagnostics=diagnostics,
        warnings=warnings,
    )
