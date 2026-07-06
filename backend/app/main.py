from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

from app.graphs.memo_graph import generate_memo_with_graph
from app.models.schemas import AnalyzeRequest, AnalyzeResponse, CompareRequest, CompareResponse
from app.services.data_loader import (
    SUPPORTED_ASSETS,
    WINDOW_PRESETS,
    generate_sample_market_data,
    load_market_data,
    parse_uploaded_csv,
    resolve_window,
)
from app.services.features import engineer_features
from app.services.regime_model import run_regime_model
from app.services.risk_metrics import annualized_volatility, max_drawdown
from app.services.validation import (
    baseline_volatility_regimes,
    build_model_card,
    data_quality_report,
    regime_segments,
    transition_stability,
)
from app.utils.serialization import clean_number

API_VERSION = "0.6.0"

app = FastAPI(
    title="RegimeLens API",
    description="Bilingual time-series regime intelligence with HMMs, Markov transitions, validation diagnostics, real-data fallback and compact structured risk memos.",
    version=API_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "RegimeLens API", "version": API_VERSION}


@app.get("/assets")
def assets() -> dict[str, list[str]]:
    return {"assets": SUPPORTED_ASSETS}


@app.get("/time-windows")
def time_windows() -> dict[str, list[str]]:
    return {"windows": WINDOW_PRESETS}


@app.get("/project-card")
def project_card() -> dict[str, Any]:
    """Portfolio copy that can be pasted into a personal landing page."""
    return {
        "name": "RegimeLens",
        "tagline": "From noisy market time series to structured regime intelligence.",
        "description": (
            "A full-stack risk intelligence demo that detects hidden market regimes with HMMs, "
            "estimates Markov transition probabilities, validates against a transparent volatility baseline, "
            "uses safe live-data fallback and generates guarded executive memos through a LangGraph workflow."
        ),
        "stack": ["FastAPI", "React", "Tailwind", "HMM", "Markov Chains", "LangGraph", "Recharts", "Docker"],
        "positioning": "Time-series AI system for risk review, not a trading bot.",
        "version": API_VERSION,
        "v5_additions": ["Cross-asset regime comparison", "Pinned frontend dependencies", "Windows quickstart scripts", "Setup doctor"],
        "v6_additions": ["English/Spanish UI toggle", "Bilingual memo/report generation", "Compact tabbed LangGraph memo panel", "Improved memo UX for portfolio demos"],
    }


@app.get("/case-study")
def case_study() -> dict[str, Any]:
    return {
        "title": "RegimeLens — Cross-Asset Demo & Validation Edition",
        "problem": "Market data is noisy, regime shifts are hard to explain, and naive dashboards often hide model uncertainty.",
        "approach": [
            "Engineer volatility, drawdown, trend and momentum features from price history.",
            "Infer hidden regimes with a Gaussian HMM, using KMeans as a demo-continuity fallback.",
            "Estimate empirical Markov transition probabilities over the inferred state path.",
            "Validate stress regimes against a transparent rolling-volatility baseline.",
            "Generate a guarded executive memo through a LangGraph-style analysis workflow.",
        ],
        "architecture": [
            "FastAPI analysis backend",
            "Feature engineering and HMM regime engine",
            "Validation layer: baseline agreement + transition stability + data quality",
            "React/Tailwind dashboard",
            "Markdown/JSON export for review",
            "Cross-asset comparison endpoint for portfolio-level regime review",
        ],
        "limitations": [
            "Regimes are inferred, not ground-truth labels.",
            "Transition probabilities are historical estimates and can decay quickly under structural change.",
            "The app is for risk review and portfolio demo purposes, not financial advice.",
        ],
    }


@app.get("/demo-script")
def demo_script() -> dict[str, Any]:
    return {
        "duration": "60-90 seconds",
        "steps": [
            "Select SPY or QQQ and keep deterministic sample data for stable demo output.",
            "Run the HMM regime analysis and explain current regime, confidence and stress-transition probability.",
            "Open Validation to show the HMM vs rolling-volatility baseline and transition stability.",
            "Open Case Study to explain architecture, modeling choices and limitations.",
            "Export Markdown to show the executive memo is reviewable and auditable.",
        ],
    }


@app.get("/quickstart")
def quickstart() -> dict[str, Any]:
    return {
        "version": API_VERSION,
        "backend": [
            "cd backend",
            "python -m venv .venv",
            r".\.venv\Scripts\activate  # Windows PowerShell",
            "pip install -r requirements.txt",
            "uvicorn app.main:app --reload --port 8000",
        ],
        "frontend": [
            "cd frontend",
            "npm install",
            "npm run doctor",
            "npm run dev",
        ],
        "common_windows_fixes": [
            "If npm is not recognized, install Node.js or add portable Node to PATH.",
            "If npm install fails with ENOSPC, free disk space and run npm cache clean --force.",
            "Tailwind is pinned to v3.4.17 to avoid the Tailwind v4 PostCSS plugin breaking change.",
        ],
    }


@app.get("/model-card")
def model_card() -> dict[str, Any]:
    return build_model_card("GaussianHMM / KMeans fallback", 3, [
        "log_return",
        "rolling_volatility",
        "rolling_mean_return",
        "drawdown",
        "ma_distance",
        "momentum_20",
        "rsi",
        "optional_volume_change",
    ])


@app.get("/sample-csv", response_class=PlainTextResponse)
def sample_csv() -> str:
    frame = generate_sample_market_data("SPY", None, None)[["date", "close", "volume"]].head(260)
    return frame.to_csv(index=False)


def _chart_frame(out: pd.DataFrame, max_points: int = 800) -> pd.DataFrame:
    if len(out) > max_points:
        return out.iloc[np.linspace(0, len(out) - 1, max_points).astype(int)].copy()
    return out.copy()


def _risk_band(score: float) -> str:
    if score >= 0.66:
        return "elevated"
    if score >= 0.38:
        return "moderate"
    return "contained"


def _build_report_markdown(
    asset: str,
    source: str,
    interval: str | None,
    result,
    risk_metrics: dict[str, Any],
    memo: dict[str, Any],
    baseline: dict[str, Any],
    stability: dict[str, Any],
    data_quality: dict[str, Any],
    language: str = "en",
) -> str:
    current = result.current_regime
    evidence = memo.get("evidence_observed", [])
    limitations = memo.get("model_limitations", [])
    considerations = memo.get("portfolio_review_considerations", [])
    if language == "es":
        labels = {
            "version": "Versión", "source": "Fuente", "interval": "Intervalo", "window": "Ventana",
            "model": "Modelo", "current": "Régimen actual", "label": "Etiqueta", "confidence": "Confianza",
            "risk_band": "Banda de riesgo", "stay": "Probabilidad de permanencia", "stress": "Probabilidad de transición a estrés",
            "evidence": "Evidencia observada", "baseline": "Baseline, estabilidad y calidad de datos",
            "review": "Consideraciones de revisión", "limits": "Limitaciones",
            "footer": "Este informe se genera para revisión de riesgo en una demo de portfolio. No es asesoramiento financiero y no proporciona instrucciones de compra/venta.",
            "custom": "personalizado", "observations": "observaciones", "largest_gap": "gap máximo"
        }
        title = f"# Informe RegimeLens — {asset}"
    else:
        labels = {
            "version": "Version", "source": "Source", "interval": "Interval", "window": "Window",
            "model": "Model", "current": "Current regime", "label": "Label", "confidence": "Confidence",
            "risk_band": "Risk band", "stay": "Stay probability", "stress": "Stress transition probability",
            "evidence": "Evidence observed", "baseline": "Baseline, stability and data quality",
            "review": "Review considerations", "limits": "Limitations",
            "footer": "This report is generated for portfolio-demo risk review. It is not financial advice and does not provide buy/sell instructions.",
            "custom": "custom", "observations": "observations", "largest_gap": "largest gap"
        }
        title = f"# RegimeLens Report — {asset}"

    lines = [
        title,
        "",
        f"**{labels['version']}:** {API_VERSION}",
        f"**{labels['source']}:** {source}",
        f"**{labels['interval']}:** {interval or labels['custom']}",
        f"**{labels['window']}:** {result.diagnostics.get('data_start')} → {result.diagnostics.get('data_end')}",
        f"**{labels['model']}:** {result.diagnostics.get('model_type')} · {result.diagnostics.get('n_regimes')} regimes",
        "",
        f"## {labels['current']}",
        f"- {labels['label']}: **{current.get('label')}**",
        f"- {labels['confidence']}: {current.get('confidence', 0):.1%}",
        f"- {labels['risk_band']}: {_risk_band(current.get('risk_score', 0))}",
        f"- {labels['stay']}: {current.get('stay_probability', 0):.1%}",
        f"- {labels['stress']}: {current.get('stress_transition_probability', 0):.1%}",
        "",
        f"## {labels['evidence']}",
    ]
    lines.extend([f"- {item}" for item in evidence])
    lines.extend([
        "",
        f"## {labels['baseline']}",
        f"- Baseline: {baseline.get('name')}",
        f"- Baseline stress agreement: {baseline.get('stress_agreement', 0):.1%}",
        f"- Baseline verdict: {baseline.get('verdict')}",
        f"- Transition stability: {stability.get('status')} ({stability.get('message')})",
        f"- Data quality: {data_quality.get('status')} · {data_quality.get('observations')} {labels['observations']} · {labels['largest_gap']} {data_quality.get('largest_gap_days')} days",
        "",
        f"## {labels['review']}",
    ])
    lines.extend([f"- {item}" for item in considerations])
    lines.extend(["", f"## {labels['limits']}"])
    lines.extend([f"- {item}" for item in limitations])
    lines.extend([
        "",
        "---",
        labels["footer"],
    ])
    return "\n".join(lines)


def _clean_mapping(obj: dict[str, Any]) -> dict[str, Any]:
    return {k: clean_number(v) for k, v in obj.items()}


def _deep_clean(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {k: _deep_clean(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_deep_clean(v) for v in obj]
    return clean_number(obj)


def _build_response(asset: str, source: str, frame: pd.DataFrame, warnings: list[str], n_regimes: int, interval: str | None, cache_hit: bool = False, language: str = "en") -> AnalyzeResponse:
    data_quality = data_quality_report(frame, source, cache_hit=cache_hit)
    warnings.extend(data_quality.get("notes", []))

    features, feature_cols, feature_warnings = engineer_features(frame)
    warnings.extend(feature_warnings)

    result = run_regime_model(features, feature_cols, n_regimes=n_regimes)
    warnings.extend(result.warnings)
    out = result.frame

    risk_metrics = {
        "latest_close": clean_number(out["close"].iloc[-1]),
        "annualized_volatility": clean_number(annualized_volatility(out["log_return"])),
        "max_drawdown": clean_number(max_drawdown(out["close"])),
        "latest_drawdown": clean_number(out["drawdown"].iloc[-1]),
        "latest_momentum_20": clean_number(out["momentum_20"].iloc[-1]),
        "latest_rsi": clean_number(out["rsi"].iloc[-1]),
        "observations": int(len(out)),
    }

    segments = regime_segments(out)
    baseline = baseline_volatility_regimes(out, n_regimes)
    stability = transition_stability(out, n_regimes)
    model_card = build_model_card(result.diagnostics["model_type"], n_regimes, feature_cols)

    memo = generate_memo_with_graph(
        {
            "asset": asset,
            "source": source,
            "warnings": warnings,
            "current_regime": result.current_regime,
            "regime_stats": result.regime_stats,
            "risk_metrics": risk_metrics,
            "transition_labels": result.transition_labels,
            "diagnostics": result.diagnostics,
            "baseline": baseline,
            "stability": stability,
            "data_quality": data_quality,
            "regime_segments": segments,
            "language": language,
        }
    )

    report_markdown = _build_report_markdown(asset, source, interval, result, risk_metrics, memo, baseline, stability, data_quality, language=language)

    out_for_chart = _chart_frame(out)
    time_series = []
    for _, row in out_for_chart.iterrows():
        time_series.append(
            {
                "date": row["date"].strftime("%Y-%m-%d"),
                "close": clean_number(row["close"]),
                "log_return": clean_number(row.get("log_return")),
                "rolling_volatility": clean_number(row.get("rolling_volatility")),
                "drawdown": clean_number(row.get("drawdown")),
                "momentum_20": clean_number(row.get("momentum_20")),
                "rsi": clean_number(row.get("rsi")),
                "regime": int(row["regime"]),
                "regime_label": str(row["regime_label"]),
                "regime_probability": clean_number(row.get("regime_probability")),
            }
        )

    return AnalyzeResponse(
        asset=asset,
        source=source,
        interval=interval,
        start=result.diagnostics["data_start"],
        end=result.diagnostics["data_end"],
        api_version=API_VERSION,
        warnings=list(dict.fromkeys([w for w in warnings if w])),
        data_quality=_deep_clean(data_quality),
        current_regime=_clean_mapping(result.current_regime),
        risk_metrics=risk_metrics,
        regime_stats=[_clean_mapping(stat) for stat in result.regime_stats],
        transition_matrix=[[clean_number(v) for v in row] for row in result.transition_matrix.tolist()],
        transition_labels=result.transition_labels,
        time_series=time_series,
        regime_segments=[_clean_mapping(seg) for seg in segments],
        baseline=_deep_clean(baseline),
        stability=_deep_clean(stability),
        model_card=model_card,
        diagnostics=_deep_clean(result.diagnostics),
        memo=memo,
        report_markdown=report_markdown,
    )


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    warnings: list[str] = []
    resolved_start, resolved_end, normalized_interval = resolve_window(request.start, request.end, request.interval)
    loaded = load_market_data(
        asset=request.asset,
        start=resolved_start,
        end=resolved_end,
        interval=normalized_interval,
        prefer_live_data=request.prefer_live_data,
    )
    if loaded.warning:
        warnings.append(loaded.warning)
    if loaded.source == "sample":
        warnings.append("Using deterministic sample data for demo reliability.")
    if loaded.cache_hit:
        warnings.append("Loaded live-provider data from local cache.")
    return _build_response(request.asset.upper(), loaded.source, loaded.frame, warnings, request.n_regimes, normalized_interval, cache_hit=loaded.cache_hit, language=request.language)


@app.post("/compare", response_model=CompareResponse)
def compare_assets(request: CompareRequest) -> CompareResponse:
    """Cross-asset regime comparison for demo portfolio review.

    This endpoint intentionally summarizes only review-relevant outputs. It is not a portfolio
    optimizer and does not issue buy/sell instructions.
    """
    if not request.assets:
        raise HTTPException(status_code=400, detail="At least one asset is required.")
    clean_assets = []
    for asset in request.assets:
        normalized = asset.strip().upper()
        if normalized and normalized not in clean_assets:
            clean_assets.append(normalized)
    if len(clean_assets) > 8:
        raise HTTPException(status_code=400, detail="Comparison is limited to 8 assets for demo responsiveness.")

    resolved_start, resolved_end, normalized_interval = resolve_window(request.start, request.end, request.interval)
    summaries: list[dict[str, Any]] = []
    errors: list[str] = []

    for asset in clean_assets:
        try:
            loaded = load_market_data(
                asset=asset,
                start=resolved_start,
                end=resolved_end,
                interval=normalized_interval,
                prefer_live_data=request.prefer_live_data,
            )
            warnings: list[str] = []
            if loaded.warning:
                warnings.append(loaded.warning)
            if loaded.source == "sample":
                warnings.append("Using deterministic sample data for demo reliability.")
            if loaded.cache_hit:
                warnings.append("Loaded live-provider data from local cache.")
            response = _build_response(asset, loaded.source, loaded.frame, warnings, request.n_regimes, normalized_interval, cache_hit=loaded.cache_hit, language=request.language)
            score = float(response.current_regime.get("risk_score", 0.0))
            summaries.append({
                "asset": asset,
                "source": response.source,
                "current_regime": str(response.current_regime.get("label", "—")),
                "confidence": float(response.current_regime.get("confidence", 0.0)),
                "risk_score": score,
                "risk_band": _risk_band(score),
                "stress_transition_probability": float(response.current_regime.get("stress_transition_probability", 0.0)),
                "stay_probability": float(response.current_regime.get("stay_probability", 0.0)),
                "latest_drawdown": float(response.risk_metrics.get("latest_drawdown", 0.0)),
                "annualized_volatility": float(response.risk_metrics.get("annualized_volatility", 0.0)),
                "baseline_agreement": float(response.baseline.get("stress_agreement", 0.0)),
                "baseline_verdict": str(response.baseline.get("verdict", "—")),
                "data_quality_status": str(response.data_quality.get("status", "—")),
                "warnings": response.warnings[:4],
            })
        except Exception as exc:
            errors.append(f"{asset}: {exc}")

    if not summaries:
        raise HTTPException(status_code=400, detail={"message": "No assets could be analyzed.", "errors": errors})

    summaries_sorted = sorted(summaries, key=lambda row: row["risk_score"], reverse=True)
    average_risk = float(np.mean([row["risk_score"] for row in summaries_sorted]))
    highest = summaries_sorted[0]["asset"] if summaries_sorted else None
    lowest = summaries_sorted[-1]["asset"] if summaries_sorted else None
    if request.language == "es":
        memo = {
            "summary": f"{len(summaries_sorted)} activos analizados. Mayor prioridad actual de revisión: {highest}. Menor score de riesgo actual: {lowest}.",
            "highest_risk_asset": highest,
            "lowest_risk_asset": lowest,
            "average_risk_score": average_risk,
            "review_notes": [
                "Usa la comparación como capa de priorización antes de abrir informes individuales por activo.",
                "Las diferencias grandes en score de riesgo deben contrastarse con calidad de datos y acuerdo con baseline.",
                "Esto es revisión de riesgo multi-activo, no optimización de portfolio ni recomendación de trading.",
            ],
            "errors": errors,
        }
    else:
        memo = {
            "summary": f"{len(summaries_sorted)} assets analyzed. Highest current review priority: {highest}. Lowest current risk score: {lowest}.",
            "highest_risk_asset": highest,
            "lowest_risk_asset": lowest,
            "average_risk_score": average_risk,
            "review_notes": [
                "Use the comparison as a prioritization layer before opening individual asset reports.",
                "Large differences in risk score should be checked against data quality and baseline agreement.",
                "This is cross-asset risk review, not a portfolio optimization or trading recommendation.",
            ],
            "errors": errors,
        }

    return CompareResponse(
        api_version=API_VERSION,
        interval=normalized_interval,
        assets_requested=clean_assets,
        summaries=summaries_sorted,
        highest_risk_asset=highest,
        lowest_risk_asset=lowest,
        average_risk_score=average_risk,
        portfolio_memo=memo,
    )


@app.post("/upload-csv", response_model=AnalyzeResponse)
async def upload_csv(file: UploadFile = File(...), n_regimes: int = 3, language: str = "en") -> AnalyzeResponse:
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
    try:
        contents = await file.read()
        frame = parse_uploaded_csv(contents)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return _build_response("CUSTOM_CSV", "uploaded_csv", frame, [], n_regimes, "custom", language=language if language in {"en", "es"} else "en")
