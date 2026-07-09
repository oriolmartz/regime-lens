from __future__ import annotations

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.main import _build_response, compare_assets
from app.models.schemas import CompareRequest
from app.services.data_loader import generate_sample_market_data


def main() -> None:
    frame = generate_sample_market_data("SPY", None, None).head(360)
    response = _build_response("SPY", "sample", frame, [], 3, "5Y", language="en")
    assert response.asset == "SPY"
    assert response.api_version == "0.10.0"
    assert response.time_series
    assert response.transition_matrix
    assert response.baseline.get("verdict") in {"aligned", "mixed", "divergent"}
    assert response.data_quality.get("observations", 0) >= 180
    assert "financial advice" in response.report_markdown.lower()

    comparison = compare_assets(CompareRequest(assets=["SPY", "QQQ"], interval="6M", data_mode="sample", language="es"))
    assert comparison.api_version == "0.10.0"
    assert len(comparison.summaries) == 2
    assert comparison.highest_risk_asset
    assert comparison.average_risk_score >= 0
    response_es = _build_response("SPY", "sample", frame, [], 3, "5Y", language="es")
    assert "asesoramiento financiero" in response_es.report_markdown.lower()
    assert "Memo de inteligencia" in response_es.memo.get("title", "")
    print("QuantRegimeTracer smoke test passed")


if __name__ == "__main__":
    main()
