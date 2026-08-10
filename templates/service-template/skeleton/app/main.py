"""Minimal service skeleton.

The health endpoints are not optional decoration — the platform's
liveness and readiness probes call them, and the baseline restart
alert is wired to the result. A service that always returns 200 from
/readyz while its downstream is down will take traffic it cannot serve.
"""

import os
from fastapi import FastAPI, Response

app = FastAPI(title=os.getenv("SERVICE_NAME", "service"))


@app.get("/healthz")
def healthz() -> dict[str, str]:
    """Liveness. Answer 'is this process wedged', nothing more."""
    return {"status": "ok"}


@app.get("/readyz")
def readyz(response: Response) -> dict[str, object]:
    """Readiness. Answer 'can this instance serve a request right now'."""
    checks = {"config": bool(os.getenv("ENVIRONMENT"))}
    if not all(checks.values()):
        response.status_code = 503
    return {"ready": all(checks.values()), "checks": checks}


@app.get("/")
def root() -> dict[str, str]:
    return {"service": app.title, "environment": os.getenv("ENVIRONMENT", "unknown")}
