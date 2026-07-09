from __future__ import annotations

from typing import Any, Dict, TypedDict


class MemoState(TypedDict, total=False):
    asset: str
    source: str
    warnings: list[str]
    current_regime: dict[str, Any]
    regime_stats: list[dict[str, Any]]
    risk_metrics: dict[str, Any]
    transition_labels: list[str]
    diagnostics: dict[str, Any]
    baseline: dict[str, Any]
    stability: dict[str, Any]
    regime_segments: list[dict[str, Any]]
    language: str
    data_quality: Any
    data_quality_summary: str
    model_summary: str
    risk_summary: str
    memo: dict[str, Any]


def _lang(state: MemoState) -> str:
    return "es" if state.get("language") == "es" else "en"


def _risk_band(score: float, language: str = "en") -> str:
    if score >= 0.66:
        return "elevado" if language == "es" else "elevated"
    if score >= 0.38:
        return "moderado" if language == "es" else "moderate"
    return "contenido" if language == "es" else "contained"


def data_quality_analyst(state: MemoState) -> MemoState:
    language = _lang(state)
    warnings = state.get("warnings", [])
    diagnostics = state.get("diagnostics", {})
    if language == "es":
        if warnings:
            quality = "Utilizable con cautelas. " + " ".join(warnings[:3])
        else:
            quality = "Los datos pasan los controles básicos de calidad para un análisis técnico de regímenes."
        quality += f" Ventana: {diagnostics.get('data_start', '—')} a {diagnostics.get('data_end', '—')}."
    else:
        if warnings:
            quality = "Usable with caveats. " + " ".join(warnings[:3])
        else:
            quality = "Data passed baseline quality checks for technical regime analysis."
        quality += f" Window: {diagnostics.get('data_start', '—')} to {diagnostics.get('data_end', '—')}."
    return {**state, "data_quality_summary": quality}


def regime_modeler(state: MemoState) -> MemoState:
    language = _lang(state)
    current = state["current_regime"]
    diagnostics = state.get("diagnostics", {})
    if language == "es":
        summary = (
            f"El régimen inferido actual es {current['label']} con "
            f"{current.get('assignment_type', 'asignación de estado')} y {current.get('evidence_strength', 0.0):.0%} de fuerza de evidencia. "
            f"La probabilidad estimada de permanecer en este régimen es {current['stay_probability']:.0%}. "
            f"Motor del modelo: {diagnostics.get('model_type', 'modelo de regímenes')}."
        )
    else:
        summary = (
            f"Current inferred regime is {current['label']} with "
            f"{current.get('assignment_type', 'state assignment')} and {current.get('evidence_strength', 0.0):.0%} evidence strength. "
            f"Estimated probability of remaining in this regime is {current['stay_probability']:.0%}. "
            f"Model engine: {diagnostics.get('model_type', 'regime model')}."
        )
    return {**state, "model_summary": summary}


def risk_analyst(state: MemoState) -> MemoState:
    language = _lang(state)
    current = state["current_regime"]
    metrics = state["risk_metrics"]
    stress = current.get("stress_transition_probability", 0.0)
    vol = metrics.get("annualized_volatility", 0.0)
    drawdown = metrics.get("max_drawdown", 0.0)
    score = current.get("risk_score", 0.0)
    band = _risk_band(score, language)
    stability = state.get("stability", {})
    baseline = state.get("baseline", {})
    if language == "es":
        summary = (
            f"La banda de riesgo es {band}. La volatilidad anualizada es aproximadamente {vol:.1%}; "
            f"el drawdown máximo en la ventana analizada está cerca de {drawdown:.1%}. "
            f"La probabilidad estimada de transición a estrés desde el estado actual es {stress:.0%}. "
            f"El acuerdo del baseline de estrés es {baseline.get('stress_agreement', 0.0):.0%}; "
            f"el estado de estabilidad de transiciones es {stability.get('status', 'desconocido')}."
        )
    else:
        summary = (
            f"Risk band is {band}. Annualized volatility is approximately {vol:.1%}; "
            f"max drawdown over the analyzed window is near {drawdown:.1%}. "
            f"Estimated stress-transition probability from the current state is {stress:.0%}. "
            f"Baseline stress agreement is {baseline.get('stress_agreement', 0.0):.0%}; "
            f"transition stability status is {stability.get('status', 'unknown')}."
        )
    return {**state, "risk_summary": summary}


def memo_writer(state: MemoState) -> MemoState:
    language = _lang(state)
    current = state["current_regime"]
    metrics = state["risk_metrics"]
    warning_text = state.get("warnings", [])
    diagnostics = state.get("diagnostics", {})
    baseline = state.get("baseline", {})
    stability = state.get("stability", {})
    recent_segments = state.get("regime_segments", [])[-3:]
    risk_band = _risk_band(current.get("risk_score", 0.0), language)

    if language == "es":
        considerations = [
            "Revisar la concentración del portfolio contra las hipótesis del régimen actual.",
            "Comparar la persistencia del régimen con el horizonte de mantenimiento previsto.",
            "Monitorizar si la evidencia de volatilidad, drawdown y momentum persiste en las siguientes observaciones.",
        ]
        if "stress" in current["label"].lower() or "estr" in current["label"].lower():
            considerations.insert(0, "Tratar nueva exposición high-beta con cautela hasta que la evidencia de régimen se estabilice.")
        elif "expansion" in current["label"].lower() or "expans" in current["label"].lower():
            considerations.append("Las condiciones de expansión pueden revertir; no asumir persistencia sin evidencia actualizada.")
        memo = {
            "title": f"Memo de inteligencia de regímenes — {state['asset']}",
            "risk_band": risk_band,
            "current_regime_summary": state["model_summary"],
            "data_quality": state["data_quality_summary"],
            "evidence_observed": [
                f"Último cierre: {metrics.get('latest_close'):.2f}",
                f"Volatilidad anualizada: {metrics.get('annualized_volatility'):.1%}",
                f"Drawdown máximo en ventana: {metrics.get('max_drawdown'):.1%}",
                f"Último drawdown: {metrics.get('latest_drawdown'):.1%}",
                f"Momentum 20 días: {metrics.get('latest_momentum_20'):.1%}",
                f"RSI actual: {metrics.get('latest_rsi'):.1f}",
            ],
            "transition_risk": state["risk_summary"],
            "validation_checks": [
                f"Baseline de sanity check: {baseline.get('latest_label', '—')} con {baseline.get('stress_agreement', 0.0):.0%} de acuerdo en etiqueta de estrés.",
                f"Estabilidad de transiciones: {stability.get('status', 'desconocida')}.",
                f"Episodios recientes de régimen revisados: {len(recent_segments)}.",
            ],
            "portfolio_review_considerations": considerations,
            "model_limitations": [
                "Los regímenes HMM son no supervisados y no deben tratarse como ground truth.",
                "El baseline de volatilidad es un sanity check, no un modelo productivo competidor.",
                "Las probabilidades de transición se estiman desde estados inferidos, no etiquetas conocidas.",
                "Los mercados financieros son no estacionarios; el comportamiento de régimen puede cambiar sin aviso.",
                "El sistema apoya revisión de riesgo y no emite instrucciones direccionales de trading.",
                f"Estado de asignación: {current.get('assignment_type', diagnostics.get('confidence_status', 'desconocido'))}.",
            ] + warning_text[:2],
            "disclaimer": "Este output no es asesoramiento financiero y no proporciona instrucciones direccionales de trading.",
        }
    else:
        considerations = [
            "Review concentration exposure against the current regime assumptions.",
            "Compare regime persistence with the portfolio's intended holding horizon.",
            "Monitor whether volatility, drawdown and momentum evidence persist in the next observations.",
        ]
        if "stress" in current["label"].lower():
            considerations.insert(0, "Treat new high-beta exposure cautiously until regime evidence stabilizes.")
        elif "expansion" in current["label"].lower():
            considerations.append("Expansion-like conditions can reverse; avoid assuming persistence without updated evidence.")
        memo = {
            "title": f"{state['asset']} Regime Intelligence Memo",
            "risk_band": risk_band,
            "current_regime_summary": state["model_summary"],
            "data_quality": state["data_quality_summary"],
            "evidence_observed": [
                f"Latest close: {metrics.get('latest_close'):.2f}",
                f"Annualized volatility: {metrics.get('annualized_volatility'):.1%}",
                f"Max drawdown in window: {metrics.get('max_drawdown'):.1%}",
                f"Latest drawdown: {metrics.get('latest_drawdown'):.1%}",
                f"Latest 20-day momentum: {metrics.get('latest_momentum_20'):.1%}",
                f"Latest RSI: {metrics.get('latest_rsi'):.1f}",
            ],
            "transition_risk": state["risk_summary"],
            "validation_checks": [
                f"Baseline sanity check: {baseline.get('latest_label', '—')} with {baseline.get('stress_agreement', 0.0):.0%} stress-label agreement.",
                f"Transition stability: {stability.get('status', 'unknown')}.",
                f"Recent regime episodes reviewed: {len(recent_segments)}.",
            ],
            "portfolio_review_considerations": considerations,
            "model_limitations": [
                "HMM regimes are unsupervised and should not be treated as ground truth.",
                "The volatility baseline is a sanity check, not a competing production model.",
                "Transition probabilities are estimated from inferred states, not known labels.",
                "Financial markets are non-stationary; regime behavior can change without warning.",
                "This system supports risk review and does not issue directional trading instructions.",
                f"Assignment status: {current.get('assignment_type', diagnostics.get('confidence_status', 'unknown'))}.",
            ] + warning_text[:2],
            "disclaimer": "This output is not financial advice and does not provide directional trading instructions.",
        }
    return {**state, "memo": memo}


def guardrail_reviewer(state: MemoState) -> MemoState:
    language = _lang(state)
    memo = state["memo"]
    if language == "es":
        memo["review_status"] = "Guardrail reviewed: el memo se formula como contexto de apoyo a decisión, no como asesoramiento financiero."
    else:
        memo["review_status"] = "Guardrail reviewed: memo is framed as decision-support context, not financial advice."
    return {**state, "memo": memo}


def generate_memo_with_graph(state: MemoState) -> dict[str, Any]:
    """Run a LangGraph workflow if available; otherwise run deterministic nodes directly."""
    try:
        from langgraph.graph import END, StateGraph

        workflow = StateGraph(MemoState)
        workflow.add_node("data_quality_analyst", data_quality_analyst)
        workflow.add_node("regime_modeler", regime_modeler)
        workflow.add_node("risk_analyst", risk_analyst)
        workflow.add_node("memo_writer", memo_writer)
        workflow.add_node("guardrail_reviewer", guardrail_reviewer)
        workflow.set_entry_point("data_quality_analyst")
        workflow.add_edge("data_quality_analyst", "regime_modeler")
        workflow.add_edge("regime_modeler", "risk_analyst")
        workflow.add_edge("risk_analyst", "memo_writer")
        workflow.add_edge("memo_writer", "guardrail_reviewer")
        workflow.add_edge("guardrail_reviewer", END)
        app = workflow.compile()
        final_state = app.invoke(state)
        return final_state["memo"]
    except Exception:
        state = data_quality_analyst(state)
        state = regime_modeler(state)
        state = risk_analyst(state)
        state = memo_writer(state)
        state = guardrail_reviewer(state)
        return state["memo"]
