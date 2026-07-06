from __future__ import annotations

import numpy as np
import pandas as pd


def compute_rsi(close: pd.Series, window: int = 14) -> pd.Series:
    delta = close.diff()
    gains = delta.clip(lower=0)
    losses = -delta.clip(upper=0)
    avg_gain = gains.ewm(alpha=1 / window, min_periods=window, adjust=False).mean()
    avg_loss = losses.ewm(alpha=1 / window, min_periods=window, adjust=False).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))
    return rsi.fillna(50)


def engineer_features(frame: pd.DataFrame) -> tuple[pd.DataFrame, list[str], list[str]]:
    warnings: list[str] = []
    df = frame.copy()
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").drop_duplicates("date")
    df["close"] = pd.to_numeric(df["close"], errors="coerce")
    df = df.dropna(subset=["close"])

    if len(df) < 120:
        warnings.append("Short time series: regime estimates may be unstable.")

    df["log_return"] = np.log(df["close"]).diff()
    df["rolling_volatility"] = df["log_return"].rolling(20).std() * np.sqrt(252)
    df["rolling_mean_return"] = df["log_return"].rolling(20).mean() * 252
    df["running_max"] = df["close"].cummax()
    df["drawdown"] = df["close"] / df["running_max"] - 1
    df["ma_20"] = df["close"].rolling(20).mean()
    df["ma_distance"] = df["close"] / df["ma_20"] - 1
    df["momentum_20"] = df["close"].pct_change(20)
    df["rsi"] = compute_rsi(df["close"])

    feature_cols = [
        "log_return",
        "rolling_volatility",
        "rolling_mean_return",
        "drawdown",
        "ma_distance",
        "momentum_20",
        "rsi",
    ]

    if "volume" in df.columns and df["volume"].notna().sum() > 50:
        df["volume_change"] = np.log(pd.to_numeric(df["volume"], errors="coerce")).diff()
        feature_cols.append("volume_change")
    else:
        warnings.append("Volume unavailable or sparse; volume-based features were skipped.")

    df = df.replace([np.inf, -np.inf], np.nan)
    df = df.dropna(subset=feature_cols).reset_index(drop=True)

    if len(df) < 120:
        warnings.append("After feature engineering, fewer than 120 rows remain. Interpret results cautiously.")

    return df, feature_cols, warnings
