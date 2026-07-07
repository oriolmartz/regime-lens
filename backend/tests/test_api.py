from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import API_VERSION, app

client = TestClient(app)


def test_health_endpoint_reports_current_version() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["version"] == API_VERSION == "0.9.0"


def test_analyze_endpoint_returns_guarded_report() -> None:
    response = client.post("/analyze", json={"asset": "SPY", "interval": "1Y", "prefer_live_data": False, "language": "en"})
    assert response.status_code == 200
    body = response.json()
    assert body["api_version"] == "0.9.0"
    assert body["asset"] == "SPY"
    assert body["time_series"]
    assert body["transition_matrix"]
    assert "financial advice" in body["report_markdown"].lower()


def test_compare_endpoint_deduplicates_assets_and_limits_output() -> None:
    response = client.post("/compare", json={"assets": ["SPY", "spy", "QQQ"], "interval": "6M", "prefer_live_data": False})
    assert response.status_code == 200
    body = response.json()
    assert body["assets_requested"] == ["SPY", "QQQ"]
    assert len(body["summaries"]) == 2
    assert body["highest_risk_asset"] in {"SPY", "QQQ"}
