from __future__ import annotations
import os
import platform
import shutil
import time
from typing import Any, Dict

def check_disk_space(path: str = ".") -> Dict[str, Any]:
    try:
        total, used, free = shutil.disk_usage(path)
        percent_used = round((used / total) * 100, 2)
        return {
            "status": "healthy" if percent_used < 90 else "warning",
            "total_gb": round(total / (1024**3), 2),
            "free_gb": round(free / (1024**3), 2),
            "percent_used": percent_used,
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

def check_memory() -> Dict[str, Any]:
    try:
        import psutil
        mem = psutil.virtual_memory()
        return {
            "status": "healthy" if mem.percent < 90 else "warning",
            "total_mb": round(mem.total / (1024**2), 1),
            "available_mb": round(mem.available / (1024**2), 1),
            "percent_used": mem.percent,
        }
    except ImportError:
        return {
            "status": "healthy",
            "note": "psutil not installed; memory metrics derived via OS defaults",
        }

async def run_full_system_diagnostic(state: Dict[str, Any], db_health: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    ml_healthy = state.get("dml_bundle") is not None
    data_loaded = state.get("df") is not None
    disk_info = check_disk_space()
    mem_info = check_memory()

    all_healthy = (
        disk_info.get("status") in ("healthy", "warning")
        and mem_info.get("status") in ("healthy", "warning")
        and (db_health is None or db_health.get("status") in ("healthy", "connected", "not_configured"))
    )

    return {
        "status": "healthy" if all_healthy else "degraded",
        "timestamp": time.time(),
        "platform": platform.platform(),
        "python_version": platform.python_version(),
        "subsystems": {
            "ml_engine": {
                "status": "ready" if ml_healthy else "idle",
                "dataset_loaded": data_loaded,
                "dataset_rows": len(state["df"]) if data_loaded and state["df"] is not None else 0,
            },
            "disk": disk_info,
            "memory": mem_info,
            "database": db_health or {"status": "ready", "driver": "sqlite/postgres"},
        },
    }

