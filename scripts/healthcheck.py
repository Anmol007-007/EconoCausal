import argparse
import json
import sys
import urllib.error
import urllib.request

def check_health(url: str = "http://localhost:8000/health", timeout: float = 5.0) -> bool:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "EconoCausal-Healthcheck/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as response:
            status_code = response.getcode()
            raw_body = response.read().decode("utf-8")
            if status_code == 200:
                data = json.loads(raw_body)
                if data.get("status") == "healthy":
                    print(f"[HEALTHCHECK OK] {url} returned healthy: {data.get('service')} v{data.get('version')}")
                    return True
                else:
                    print(f"[HEALTHCHECK UNHEALTHY] Status: {data.get('status')}", file=sys.stderr)
                    return False
            else:
                print(f"[HEALTHCHECK FAILED] HTTP status code {status_code}", file=sys.stderr)
                return False
    except urllib.error.URLError as err:
        print(f"[HEALTHCHECK ERROR] Failed to connect to {url}: {err.reason}", file=sys.stderr)
        return False
    except Exception as exc:
        print(f"[HEALTHCHECK ERROR] Unexpected error: {exc}", file=sys.stderr)
        return False

def main() -> None:
    parser = argparse.ArgumentParser(description="Healthcheck probe for EconoCausal server.")
    parser.add_argument("--url", default="http://localhost:8000/health", help="Healthcheck URL endpoint")
    parser.add_argument("--timeout", type=float, default=5.0, help="Request timeout in seconds")
    args = parser.parse_args()

    success = check_health(url=args.url, timeout=args.timeout)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
