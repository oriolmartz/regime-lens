from __future__ import annotations

from contextlib import contextmanager
from itertools import combinations
from typing import Any
import logging

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler



class _ListLogHandler(logging.Handler):
    def __init__(self, messages: list[str]) -> None:
        super().__init__(level=logging.WARNING)
        self.messages = messages

    def emit(self, record: logging.LogRecord) -> None:
        message = record.getMessage()
        if message:
            self.messages.append(message)


@contextmanager
def _capture_hmm_logs() -> list[str]:
    messages: list[str] = []
    handler = _ListLogHandler(messages)
    loggers = [logging.getLogger('hmmlearn'), logging.getLogger('hmmlearn.base')]
    previous: list[tuple[logging.Logger, int, bool]] = []
    for logger in loggers:
        previous.append((logger, logger.level, logger.propagate))
        logger.addHandler(handler)
        logger.setLevel(logging.WARNING)
        logger.propagate = False
    try:
        yield messages
    finally:
        for logger, level, propagate in previous:
            logger.removeHandler(handler)
            logger.setLevel(level)
            logger.propagate = propagate

def normalized_entropy(probabilities: np.ndarray | list[float]) -> float:
    """Return entropy on [0, 1] for a probability vector.

    A value near 0 means one state dominates. A value near 1 means probability mass is
    diffuse across states. The UI uses this as a readable uncertainty signal rather
    than pretending posterior state mass is always equally informative.
    """
    probs = np.asarray(probabilities, dtype=float)
    probs = np.clip(probs, 0.0, 1.0)
    total = float(probs.sum())
    if total <= 0 or len(probs) <= 1:
        return 0.0
    probs = probs / total
    positive = probs[probs > 0]
    entropy = -float(np.sum(positive * np.log(positive)))
    return float(entropy / np.log(len(probs)))


def hmm_parameter_count(n_states: int, n_features: int, covariance_type: str = "full") -> int:
    """Approximate free parameters for GaussianHMM model-selection diagnostics."""
    transition_params = n_states * (n_states - 1)
    start_params = n_states - 1
    mean_params = n_states * n_features
    if covariance_type == "diag":
        covariance_params = n_states * n_features
    else:
        covariance_params = n_states * n_features * (n_features + 1) // 2
    return int(start_params + transition_params + mean_params + covariance_params)


def _score_hmm(
    train: np.ndarray,
    test: np.ndarray,
    n_states: int,
    covariance_type: str,
    n_iter: int,
    random_state: int = 42,
) -> dict[str, Any]:
    from hmmlearn.hmm import GaussianHMM

    model = GaussianHMM(
        n_components=n_states,
        covariance_type=covariance_type,
        n_iter=n_iter,
        random_state=random_state,
        min_covar=1e-4,
    )
    with _capture_hmm_logs() as hmm_logs:
        model.fit(train)
    train_ll = float(model.score(train))
    test_ll = float(model.score(test)) if len(test) else None
    params = hmm_parameter_count(n_states, train.shape[1], covariance_type)
    n = max(len(train), 1)
    return {
        "n_regimes": int(n_states),
        "train_log_likelihood": train_ll,
        "test_log_likelihood": test_ll,
        "train_log_likelihood_per_obs": float(train_ll / n),
        "test_log_likelihood_per_obs": float(test_ll / len(test)) if test_ll is not None and len(test) else None,
        "aic": float(2 * params - 2 * train_ll),
        "bic": float(params * np.log(n) - 2 * train_ll),
        "n_parameters": int(params),
        "converged": bool(getattr(getattr(model, "monitor_", None), "converged", False)),
        "convergence_warnings": hmm_logs,
    }


def _selected_gap(selected: dict[str, Any] | None) -> float | None:
    if not selected or selected.get("test_log_likelihood_per_obs") is None:
        return None
    return float(selected["train_log_likelihood_per_obs"] - selected["test_log_likelihood_per_obs"])


def _recommend_regime_count(rows: list[dict[str, Any]], selected_regimes: int) -> dict[str, Any]:
    """Choose a candidate using BIC first, held-out fit as secondary context."""
    if not rows:
        return {
            "recommended_n_regimes": int(selected_regimes),
            "recommendation_basis": "fallback_selected",
            "recommendation_reason": "No candidate diagnostics were available; keeping the selected regime count.",
            "selected_matches_recommendation": True,
        }

    best_bic = min(rows, key=lambda row: row["bic"])
    best_test = max(
        [row for row in rows if row.get("test_log_likelihood_per_obs") is not None],
        key=lambda row: row["test_log_likelihood_per_obs"],
        default=None,
    )
    recommended = int(best_bic["n_regimes"])
    reason = (
        f"{recommended} regimes has the lowest BIC among scored candidates, so it is the parsimonious default. "
        "Use the held-out log-likelihood column as a secondary check rather than as a trading metric."
    )
    if best_test and int(best_test["n_regimes"]) != recommended:
        reason += f" The strongest held-out log-likelihood candidate was {int(best_test['n_regimes'])}, so this is a review point rather than a blind auto-choice."

    return {
        "recommended_n_regimes": recommended,
        "recommendation_basis": "bic_primary_test_loglik_secondary",
        "recommendation_reason": reason,
        "selected_matches_recommendation": int(selected_regimes) == recommended,
        "best_bic_candidate": best_bic,
        "best_test_loglik_candidate": best_test,
    }


def assignment_stability_review(
    frame: pd.DataFrame,
    feature_cols: list[str],
    selected_regimes: int,
    seeds: list[int] | None = None,
    covariance_type: str = "full",
    n_iter: int = 120,
) -> dict[str, Any]:
    """Fit the selected HMM several times and compare regime assignments.

    Adjusted Rand Index is invariant to label switching, so it is appropriate for checking
    whether separate random initializations find materially similar state partitions.
    """
    seed_values = seeds or [7, 13, 29, 42, 71]
    X_raw = frame[feature_cols].astype(float).replace([np.inf, -np.inf], np.nan).dropna().to_numpy()
    if len(X_raw) < 240:
        return {
            "status": "insufficient_window",
            "message": "At least 240 engineered observations are recommended for multi-seed stability review.",
            "selected_regimes": int(selected_regimes),
            "seeds": seed_values,
            "successful_runs": 0,
        }

    try:
        from hmmlearn.hmm import GaussianHMM
        from sklearn.metrics import adjusted_rand_score
    except ModuleNotFoundError as exc:
        return {
            "status": "unavailable",
            "message": f"Multi-seed HMM stability requires hmmlearn in this runtime: {exc}",
            "selected_regimes": int(selected_regimes),
            "seeds": seed_values,
            "successful_runs": 0,
        }

    X = StandardScaler().fit_transform(X_raw)
    assignments: list[np.ndarray] = []
    log_likelihoods: list[float] = []
    warnings: list[str] = []
    for seed in seed_values:
        try:
            model = GaussianHMM(
                n_components=int(selected_regimes),
                covariance_type=covariance_type,
                n_iter=n_iter,
                random_state=int(seed),
                min_covar=1e-4,
            )
            with _capture_hmm_logs() as hmm_logs:
                model.fit(X)
            warnings.extend([f"Seed {seed}: {msg}" for msg in hmm_logs])
            assignments.append(model.predict(X))
            log_likelihoods.append(float(model.score(X)))
        except Exception as exc:  # HMM convergence can fail on degenerate windows; keep reporting honest.
            warnings.append(f"Seed {seed} failed: {exc}")

    if len(assignments) < 2:
        return {
            "status": "failed",
            "message": "Fewer than two HMM runs completed, so assignment stability could not be estimated.",
            "selected_regimes": int(selected_regimes),
            "seeds": seed_values,
            "successful_runs": len(assignments),
            "warnings": warnings,
        }

    pairwise = [float(adjusted_rand_score(a, b)) for a, b in combinations(assignments, 2)]
    mean_ari = float(np.mean(pairwise))
    min_ari = float(np.min(pairwise))
    if mean_ari >= 0.78 and min_ari >= 0.55:
        verdict = "stable"
    elif mean_ari >= 0.48:
        verdict = "moderate"
    else:
        verdict = "unstable"

    return {
        "status": "ok",
        "message": "Selected regime count was refit across multiple random seeds and assignments were compared with Adjusted Rand Index.",
        "selected_regimes": int(selected_regimes),
        "seeds": seed_values,
        "successful_runs": len(assignments),
        "mean_adjusted_rand_index": mean_ari,
        "min_adjusted_rand_index": min_ari,
        "log_likelihood_std": float(np.std(log_likelihoods)) if log_likelihoods else None,
        "verdict": verdict,
        "interpretation": "Higher ARI means separate HMM initializations converge to similar partitions; low ARI means the regime path should be treated as unstable.",
        "warnings": warnings,
    }


def temporal_hmm_evaluation(
    frame: pd.DataFrame,
    feature_cols: list[str],
    selected_regimes: int,
    candidate_regimes: list[int] | None = None,
    train_fraction: float = 0.7,
    covariance_type: str = "full",
    n_iter: int = 120,
) -> dict[str, Any]:
    """Lightweight temporal holdout evaluation for the unsupervised regime engine.

    This is intentionally modest: it is not a production model-selection framework,
    but it gives reviewers concrete quant diagnostics beyond visual inspection.
    """
    candidates = candidate_regimes or [2, 3, 4, 5]
    candidates = sorted({int(k) for k in candidates if 2 <= int(k) <= 5})
    X_raw = frame[feature_cols].astype(float).replace([np.inf, -np.inf], np.nan).dropna().to_numpy()
    if len(X_raw) < 240:
        return {
            "status": "insufficient_window",
            "message": "At least 240 engineered observations are recommended for temporal HMM evaluation.",
            "selected_regimes": int(selected_regimes),
            "recommended_n_regimes": int(selected_regimes),
            "selected_matches_recommendation": True,
            "train_fraction": float(train_fraction),
            "candidates": [],
            "assignment_stability": assignment_stability_review(frame, feature_cols, selected_regimes, covariance_type=covariance_type, n_iter=n_iter),
        }

    split = int(len(X_raw) * train_fraction)
    split = min(max(split, 120), len(X_raw) - 60)
    train_raw = X_raw[:split]
    test_raw = X_raw[split:]
    scaler = StandardScaler()
    train = scaler.fit_transform(train_raw)
    test = scaler.transform(test_raw)

    rows: list[dict[str, Any]] = []
    warnings: list[str] = []
    try:
        for n_states in candidates:
            if len(train) <= n_states * 20 or len(test) <= n_states * 10:
                continue
            try:
                rows.append(_score_hmm(train, test, n_states, covariance_type, n_iter))
            except Exception as exc:  # HMMs can fail on degenerate covariance; keep diagnostics graceful.
                warnings.append(f"Candidate {n_states} failed: {exc}")
    except ModuleNotFoundError as exc:
        return {
            "status": "unavailable",
            "message": f"hmmlearn is not installed in this environment: {exc}",
            "selected_regimes": int(selected_regimes),
            "recommended_n_regimes": int(selected_regimes),
            "selected_matches_recommendation": True,
            "train_fraction": float(train_fraction),
            "candidates": [],
            "assignment_stability": assignment_stability_review(frame, feature_cols, selected_regimes, covariance_type=covariance_type, n_iter=n_iter),
            "warnings": warnings,
        }

    stability = assignment_stability_review(frame, feature_cols, selected_regimes, covariance_type=covariance_type, n_iter=n_iter)
    if not rows:
        return {
            "status": "failed",
            "message": "No HMM candidate could be scored on the temporal holdout.",
            "selected_regimes": int(selected_regimes),
            "recommended_n_regimes": int(selected_regimes),
            "selected_matches_recommendation": True,
            "train_fraction": float(train_fraction),
            "candidates": [],
            "assignment_stability": stability,
            "warnings": warnings,
        }

    recommendation = _recommend_regime_count(rows, selected_regimes)
    best_bic = recommendation["best_bic_candidate"]
    best_test = recommendation.get("best_test_loglik_candidate")
    selected = next((row for row in rows if row["n_regimes"] == int(selected_regimes)), None)
    ll_gap = _selected_gap(selected)

    if ll_gap is None:
        verdict = "review"
    elif ll_gap < 0.35:
        verdict = "healthy"
    elif ll_gap < 0.9:
        verdict = "watch"
    else:
        verdict = "overfit_risk"

    return {
        "status": "ok",
        "message": "GaussianHMM candidates were scored on a chronological train/test split.",
        "selected_regimes": int(selected_regimes),
        "train_fraction": float(train_fraction),
        "train_observations": int(len(train)),
        "test_observations": int(len(test)),
        "covariance_type": covariance_type,
        "candidates": rows,
        "best_bic_regimes": int(best_bic["n_regimes"]),
        "best_test_loglik_regimes": int(best_test["n_regimes"]) if best_test else None,
        "selected_train_test_loglik_gap": ll_gap,
        "verdict": verdict,
        "assignment_stability": stability,
        "interpretation": (
            "Lower BIC rewards fit while penalizing extra states; higher temporal test log-likelihood per observation "
            "suggests better out-of-sample sequence fit. This is a diagnostic, not a trading backtest."
        ),
        "warnings": warnings,
        **recommendation,
    }
