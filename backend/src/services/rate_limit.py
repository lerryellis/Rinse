"""Simple in-memory IP rate limiter for auth endpoints."""
from __future__ import annotations

import time
from collections import defaultdict
from typing import Optional

# Store: ip -> list of timestamps
_requests: dict[str, list[float]] = defaultdict(list)

# Auth rate limits
AUTH_WINDOW_SECONDS = 300  # 5 minutes
AUTH_MAX_REQUESTS = 10  # max 10 attempts per 5 minutes


def check_rate_limit(ip: str, window: int = AUTH_WINDOW_SECONDS, max_requests: int = AUTH_MAX_REQUESTS) -> Optional[str]:
    """Returns an error message if rate limited, or None if OK."""
    now = time.time()
    cutoff = now - window

    # Clean old entries
    _requests[ip] = [t for t in _requests[ip] if t > cutoff]

    if len(_requests[ip]) >= max_requests:
        return "Too many requests. Please try again in a few minutes."

    _requests[ip].append(now)
    return None
