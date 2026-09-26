"""
PACCAR TestPilot AI — End-to-End Demo Flow Execution Script

Executes and validates the exact sequential flow:
Requirement
→ /analyze
→ /generate-tests
→ /critic
→ /run-tests
"""

import sys
import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000"

DEMO_REQUIREMENT = (
    "The telematics ECU shall transmit vehicle GPS position every 10 seconds "
    "when ignition is ON and cellular connectivity is available."
)

def post_json(endpoint: str, payload: dict) -> dict:
    url = f"{BASE_URL}{endpoint}"
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body)
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"HTTPError on {endpoint}: {e.code} - {err_body}")
        raise
    except Exception as e:
        print(f"Network error on {endpoint}: {e}")
        raise

def main():
    print("=" * 70)
    print("PACCAR TestPilot AI — Verification of End-to-End Flow")
    print("=" * 70)
    print(f"\n[INPUT REQUIREMENT]:\n\"{DEMO_REQUIREMENT}\"\n")

    # 1. Health Check
    print("-" * 70)
    print("STAGE 0: GET /health")
    with urllib.request.urlopen(f"{BASE_URL}/health") as resp:
        health_data = json.loads(resp.read().decode("utf-8"))
    print(f"✓ Service Status: {health_data['status']} | Service: {health_data['service']} | Version: {health_data['version']}")

    # 2. POST /analyze
    print("-" * 70)
    print("STAGE 1: POST /analyze")
    analysis = post_json("/analyze", {"requirement": DEMO_REQUIREMENT})
    print(json.dumps(analysis, indent=2))
    assert any("GPS" in str(i).upper() for i in analysis["inputs"]), "GPS input missing"
    assert any("CELLULAR" in str(i).upper() for i in analysis["interfaces"]), "Cellular interface missing"
    print("✓ /analyze successfully extracted automotive engineering entities.")

    # 3. POST /generate-tests
    print("-" * 70)
    print("STAGE 2: POST /generate-tests")
    gen_payload = {
        "requirement": DEMO_REQUIREMENT,
        "analysis": analysis
    }
    gen_response = post_json("/generate-tests", gen_payload)
    tests = gen_response.get("tests", [])
    print(f"Generated {gen_response['count']} tests:")
    for t in tests:
        print(f"  [{t['test_id']}] ({t['category']}) {t['title']} (Priority: {t['priority']}, Risk: {t['risk']})")
    assert len(tests) >= 5, "Expected at least 5 test cases"
    print("✓ /generate-tests successfully synthesized test cases across multiple categories.")

    # 4. POST /critic
    print("-" * 70)
    print("STAGE 3: POST /critic")
    critic_payload = {
        "requirement": DEMO_REQUIREMENT,
        "tests": tests
    }
    critic_response = post_json("/critic", critic_payload)
    print(json.dumps(critic_response, indent=2))
    assert "coverage_percentage" in critic_response, "coverage_percentage missing"
    print(f"✓ /critic evaluated test suite: AI Coverage Estimate = {critic_response['coverage_percentage']}%")

    # 5. POST /run-tests
    print("-" * 70)
    print("STAGE 4: POST /run-tests (Simulated Execution & Defect Detection)")
    run_payload = {
        "tests": tests
    }
    run_response = post_json("/run-tests", run_payload)
    print(f"Run ID: {run_response['run_id']}")
    print(f"Summary: Total={run_response['summary']['total']}, Passed={run_response['summary']['passed']}, Failed={run_response['summary']['failed']}")
    print("\nExecution Results:")
    for res in run_response["results"]:
        status_icon = "✓ PASS" if res["status"] == "PASS" else "✗ FAIL"
        print(f"  {status_icon} | [{res['test_id']}] {res['observed_result'][:75]}...")
        if res["status"] == "FAIL":
            print(f"         Defect: {res['potential_defect']}")
            print(f"         Reason: {res['failure_reason']}")

    assert run_response["summary"]["failed"] >= 1, "Expected simulated failure on stale data defect"
    print("✓ /run-tests successfully simulated execution and detected defect.")

    print("\n" + "=" * 70)
    print("ALL 4 FLOW STAGES PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    main()
