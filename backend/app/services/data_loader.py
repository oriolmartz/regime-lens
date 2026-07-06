from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from hashlib import sha256
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd

SUPPORTED_ASSETS = [
    "SPY",
    "QQQ",
    "BTC-USD",
    "ETH-USD",
    "AAPL",
    "MSFT",
    "NVDA",
    "META",
    "IWM",
    "DIA",
    "GLD",
    "TLT",
]
WINDOW_PRESETS = ["6M", "1Y", "3Y", "5Y", "MAX"]
DEFAULT_START = date(2021, 1, 1)
DEFAULT_END = date(2026, 6, 30)
CACHE_DIR = Path(__file__).resolve().parents[3] / ".cache" / "market_data"
CACHE_DIR.mkdir(parents=True, exist_ok=True)


@dataclass
class LoadedData:
    frame: pd.DataFrame
    source: str
    warning: Optional[str] = None
    cache_hit: bool = False


def resolve_window(start: Optional[date], end: Optional[date], interval: Optional[str]) -> tuple[date, date, str]:
    """Resolve explicit dates or a preset window into stable demo dates.

    The demo is intentionally stable by default. If the user requests live data, the
    end date defaults to the current date; otherwise it uses DEFAULT_END so charts
    and screenshots remain reproducible.
    """
    normalized = (interval or "5Y").upper()
    end_date = end or DEFAULT_END
    if start:
        return start, end_date, normalized
    if normalized == "6M":
        start_date = end_date - timedelta(days=183)
    elif normalized == "1Y":
        start_date = end_date - timedelta(days=365)
    elif normalized == "3Y":
        start_date = end_date - timedelta(days=365 * 3)
    elif normalized == "MAX":
        start_date = date(2016, 1, 1)
    else:
        normalized = "5Y"
        start_date = end_date - timedelta(days=365 * 5)
    return start_date, end_date, normalized


def _date_range(start: Optional[date], end: Optional[date]) -> pd.DatetimeIndex:
    start_ts = pd.Timestamp(start or DEFAULT_START)
    end_ts = pd.Timestamp(end or DEFAULT_END)
    if end_ts <= start_ts:
        end_ts = start_ts + pd.Timedelta(days=365)
    return pd.bdate_range(start_ts, end_ts)


def _asset_seed(asset: str) -> int:
    # Python's built-in hash is salted per process; sha256 keeps demo data reproducible.
    return int(sha256(asset.upper().encode("utf-8")).hexdigest()[:8], 16)


def _cache_path(asset: str, start: date, end: date) -> Path:
    safe = asset.upper().replace("^", "IDX_").replace("-", "_").replace("/", "_")
    return CACHE_DIR / f"{safe}_{start.isoformat()}_{end.isoformat()}.csv"


def _normalize_downloaded_frame(raw: pd.DataFrame) -> pd.DataFrame:
    if isinstance(raw.columns, pd.MultiIndex):
        raw.columns = [c[0] if isinstance(c, tuple) else c for c in raw.columns]
    raw = raw.reset_index()
    date_col = "Date" if "Date" in raw.columns else raw.columns[0]
    close_col = "Close" if "Close" in raw.columns else "Adj Close" if "Adj Close" in raw.columns else None
    if close_col is None:
        raise ValueError("Downloaded data did not contain a Close or Adj Close column.")
    out = pd.DataFrame(
        {
            "date": pd.to_datetime(raw[date_col], errors="coerce"),
            "close": pd.to_numeric(raw[close_col], errors="coerce"),
            "volume": pd.to_numeric(raw["Volume"], errors="coerce") if "Volume" in raw.columns else np.nan,
        }
    ).dropna(subset=["date", "close"])
    out = out.sort_values("date").drop_duplicates("date")
    return out


def generate_sample_market_data(asset: str, start: Optional[date], end: Optional[date]) -> pd.DataFrame:
    """Generate deterministic regime-switching demo data.

    The objective is portfolio-demo reliability. The generated path contains latent
    regimes with different drift, volatility and persistence patterns, so the HMM
    has a meaningful structure to recover even when live data is unavailable.
    """
    rng = np.random.default_rng(_asset_seed(asset))
    dates = _date_range(start, end)
    n = len(dates)
    if n < 180:
        dates = pd.bdate_range(dates.min(), periods=360)
        n = len(dates)

    transition = np.array(
        [
            [0.945, 0.045, 0.010],
            [0.075, 0.850, 0.075],
            [0.035, 0.115, 0.850],
        ]
    )
    # State 0: expansion, state 1: transition/sideways, state 2: stress.
    drifts = np.array([0.00058, 0.00004, -0.00092])
    vols = np.array([0.0062, 0.0120, 0.0250])

    states = np.zeros(n, dtype=int)
    for i in range(1, n):
        states[i] = rng.choice([0, 1, 2], p=transition[states[i - 1]])

    # A small volatility-clustering term keeps the sample path less toy-like.
    shock = rng.normal(0, 1, size=n)
    cluster = pd.Series(np.abs(shock)).rolling(8, min_periods=1).mean().to_numpy()
    returns = drifts[states] + vols[states] * shock * (0.75 + 0.25 * cluster)

    base_price = {
        "SPY": 475,
        "QQQ": 420,
        "BTC-USD": 68000,
        "ETH-USD": 3400,
        "AAPL": 205,
        "MSFT": 430,
        "NVDA": 125,
        "META": 520,
        "IWM": 210,
        "DIA": 390,
        "GLD": 230,
        "TLT": 92,
    }.get(asset.upper(), 100)
    close = base_price * np.exp(np.cumsum(returns))
    volume = rng.lognormal(mean=16, sigma=0.35, size=n).astype(int)

    return pd.DataFrame(
        {
            "date": dates,
            "close": close,
            "volume": volume,
            "synthetic_state": states,
        }
    )


def load_market_data(
    asset: str,
    start: Optional[date] = None,
    end: Optional[date] = None,
    interval: Optional[str] = "5Y",
    prefer_live_data: bool = False,
) -> LoadedData:
    asset = asset.upper()
    resolved_start, resolved_end, _ = resolve_window(start, end, interval)

    if prefer_live_data:
        cache_path = _cache_path(asset, resolved_start, resolved_end)
        if cache_path.exists():
            cached = pd.read_csv(cache_path)
            cached["date"] = pd.to_datetime(cached["date"], errors="coerce")
            cached = cached.dropna(subset=["date", "close"])
            if len(cached) >= 180:
                return LoadedData(frame=cached, source="cache:yfinance", cache_hit=True)
        try:
            import yfinance as yf

            raw = yf.download(
                asset,
                start=str(resolved_start),
                end=str(resolved_end),
                progress=False,
                auto_adjust=True,
                group_by="column",
                threads=False,
            )
            if raw is not None and len(raw) >= 180:
                out = _normalize_downloaded_frame(raw)
                if len(out) >= 180:
                    out.to_csv(cache_path, index=False)
                    return LoadedData(frame=out, source="yfinance", cache_hit=False)
            raise ValueError("Live provider returned too few valid observations.")
        except Exception as exc:  # pragma: no cover - external API best effort
            return LoadedData(
                frame=generate_sample_market_data(asset, resolved_start, resolved_end),
                source="sample",
                warning=f"Live data failed; using deterministic sample data. Reason: {exc}",
            )

    return LoadedData(frame=generate_sample_market_data(asset, resolved_start, resolved_end), source="sample")


def parse_uploaded_csv(contents: bytes) -> pd.DataFrame:
    from io import BytesIO

    frame = pd.read_csv(BytesIO(contents))
    frame.columns = [c.strip().lower() for c in frame.columns]
    if "date" not in frame.columns or "close" not in frame.columns:
        raise ValueError("CSV must contain at least 'date' and 'close' columns.")
    out = pd.DataFrame(
        {
            "date": pd.to_datetime(frame["date"], errors="coerce"),
            "close": pd.to_numeric(frame["close"], errors="coerce"),
            "volume": pd.to_numeric(frame.get("volume", np.nan), errors="coerce"),
        }
    )
    out = out.dropna(subset=["date", "close"]).sort_values("date")
    out = out.drop_duplicates("date")
    if len(out) < 180:
        raise ValueError("CSV must contain at least 180 valid observations for regime analysis.")
    return out
