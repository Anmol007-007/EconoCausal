from __future__ import annotations
import argparse
from collections import Counter
import json
from pathlib import Path
import sys
from typing import Any, Dict, List

def parse_logs(log_file: Path) -> List[Dict[str, Any]]:
    records: List[Dict[str, Any]] = []
    if not log_file.exists():
        print(f"Error: Log file not found: {log_file}")
        return records

    with open(log_file, "r", encoding="utf-8") as f:
        for idx, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                records.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return records

def analyze_logs(records: List[Dict[str, Any]], error_only: bool = False, min_duration: float = 0.0) -> None:
    if not records:
        print("No log records found to analyze.")
        return

    level_counts = Counter(r.get("level", "UNKNOWN").upper() for r in records)
    endpoints = Counter(r.get("path") for r in records if r.get("path"))
    status_codes = Counter(str(r.get("status_code")) for r in records if r.get("status_code"))
    durations = [r.get("duration_ms") for r in records if isinstance(r.get("duration_ms"), (int, float))]

    print("==================================================")
    print("         ECONOCAUSAL LOG TELEMETRY SUMMARY        ")
    print("==================================================")
    print(f"Total Log Records: {len(records)}")
    print("\nLog Levels:")
    for lvl, count in level_counts.most_common():
        print(f"  {lvl:<10}: {count:>6}")

    if status_codes:
        print("\nHTTP Status Codes:")
        for code, count in status_codes.most_common():
            print(f"  HTTP {code:<6}: {count:>6}")

    if endpoints:
        print("\nTop Endpoints by Traffic:")
        for ep, count in endpoints.most_common(10):
            print(f"  {ep:<35}: {count:>5}")

    if durations:
        avg_dur = sum(durations) / len(durations)
        p95_idx = int(0.95 * len(durations))
        sorted_durs = sorted(durations)
        print("\nLatency Metrics (ms):")
        print(f"  Mean Latency : {avg_dur:.2f} ms")
        print(f"  Max Latency  : {sorted_durs[-1]:.2f} ms")
        print(f"  p95 Latency  : {sorted_durs[min(p95_idx, len(sorted_durs)-1)]:.2f} ms")

    if error_only:
        print("\nCritical & Error Events:")
        errors = [r for r in records if r.get("level") in ("ERROR", "CRITICAL") or str(r.get("status_code", "")).startswith(("4", "5"))]
        for e in errors[:15]:
            print(f"  [{e.get('timestamp')}] {e.get('method', '')} {e.get('path', '')} -> {e.get('error', e.get('message'))}")

    print("==================================================")

def main() -> None:
    parser = argparse.ArgumentParser(description="EconoCausal JSON Structured Log Analyzer")
    parser.add_argument("log_file", type=Path, nargs="?", default=Path("logs/app.log"), help="Path to JSON log file")
    parser.add_argument("--errors", action="store_true", help="Display only error events")
    parser.add_argument("--min-duration", type=float, default=0.0, help="Filter requests slower than min duration in ms")
    args = parser.parse_args()

    records = parse_logs(args.log_file)
    analyze_logs(records, error_only=args.errors, min_duration=args.min_duration)

if __name__ == "__main__":
    main()

