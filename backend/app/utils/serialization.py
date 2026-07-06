from __future__ import annotations

import math
from typing import Any

import numpy as np


def clean_number(value: Any) -> Any:
    """Convert numpy values and NaNs into JSON-safe values."""
    if value is None:
        return None
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating,)):
        value = float(value)
    if isinstance(value, float):
        if math.isnan(value) or math.isinf(value):
            return None
        return round(value, 6)
    return value
