"""
Comprehensive test suite for PACCAR TestPilot AI backend.
Verifies all 6 required criteria:
1. /health works.
2. /analyze returns valid structured JSON.
3. /generate-tests returns test cases.
4. /critic returns coverage.
5. /run-tests returns simulated execution results (including intentional demo failure).
6. Demo mode works deterministically without Gemini.
"""

import sys
import unittest
from fastapi.testclient import TestClient
from main import app
from config import settings

DEMO_REQ = (
    "The telematics ECU shall transmit vehicle GPS position every 10 seconds "
    "when ignition is ON and cellular connectivity is available."
)

class TestPACCARBackend(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_01_health_endpoint(self):
        """Verify GET /health returns ok and service name."""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["service"], "PACCAR TestPilot AI")
        print("✓ /health passed")

    def test_02_analyze_endpoint(self):
        """Verify POST /analyze extracts structured engineering information."""
        response = self.client.post("/analyze", json={"requirement": DEMO_REQ})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify required keys
        expected_keys = [
            "requirement_id", "requirement_text", "component", "category",
            "interfaces", "inputs", "outputs", "constraints", "dependencies",
            "risks", "conditions"
        ]
        for key in expected_keys:
            self.assertIn(key, data, f"Missing key in /analyze: {key}")

        # Check values for demo requirement
        self.assertEqual(data["component"], "Telematics ECU")
        self.assertTrue(any("GPS" in str(x).upper() for x in data["inputs"]), "GPS input missing from analysis")
        self.assertTrue(any("IGNITION" in str(x).upper() for x in data["inputs"]), "Ignition input missing from analysis")
        self.assertTrue(any("CELLULAR" in str(x).upper() for x in data["interfaces"]), "Cellular interface missing from analysis")
        print(f"✓ /analyze passed: Component={data['component']}, Category={data['category']}")

    def test_03_generate_tests_endpoint(self):
        """Verify POST /generate-tests produces a structured automotive test suite."""
        response = self.client.post("/generate-tests", json={"requirement": DEMO_REQ})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertIn("tests", data)
        self.assertIn("count", data)
        self.assertIn("disclaimer", data)
        self.assertGreater(data["count"], 0)

        # Validate every test case against required fields
        required_fields = [
            "test_id", "requirement_id", "title", "category",
            "priority", "risk", "preconditions", "steps",
            "expected_result", "reason_generated"
        ]
        categories = set()
        for tc in data["tests"]:
            for field in required_fields:
                self.assertIn(field, tc, f"Missing field '{field}' in test case {tc.get('test_id')}")
            categories.add(tc["category"])

        # Check that multiple automotive categories are represented
        self.assertTrue(len(categories) >= 3, f"Expected at least 3 categories, got: {categories}")
        print(f"✓ /generate-tests passed: Generated {data['count']} tests covering categories: {categories}")

    def test_04_critic_endpoint(self):
        """Verify POST /critic evaluates test coverage and provides recommendations."""
        # First generate tests
        gen_res = self.client.post("/generate-tests", json={"requirement": DEMO_REQ})
        tests = gen_res.json()["tests"]

        # Critique
        response = self.client.post("/critic", json={
            "requirement": DEMO_REQ,
            "tests": tests
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertIn("coverage_percentage", data)
        self.assertIn("covered_categories", data)
        self.assertIn("missing_scenarios", data)
        self.assertIn("recommendations", data)
        self.assertIn("additional_test_suggestions", data)

        self.assertGreaterEqual(data["coverage_percentage"], 0)
        self.assertLessEqual(data["coverage_percentage"], 100)
        print(f"✓ /critic passed: AI Estimated Coverage = {data['coverage_percentage']}%")

    def test_05_run_tests_endpoint(self):
        """Verify POST /run-tests simulates execution and detects defect on stale data."""
        gen_res = self.client.post("/generate-tests", json={"requirement": DEMO_REQ})
        tests = gen_res.json()["tests"]

        response = self.client.post("/run-tests", json={"tests": tests})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertIn("run_id", data)
        self.assertIn("results", data)
        self.assertIn("summary", data)

        results = data["results"]
        statuses = {r["status"] for r in results}
        self.assertIn("PASS", statuses)
        self.assertIn("FAIL", statuses, "Demonstration requirement should include one simulated failure for defect detection.")

        # Find the failing test
        failing_tests = [r for r in results if r["status"] == "FAIL"]
        self.assertGreaterEqual(len(failing_tests), 1)
        stale_defect = failing_tests[0]
        self.assertIsNotNone(stale_defect["potential_defect"])
        print(f"✓ /run-tests passed: RunID={data['run_id']} | Total={data['summary']['total']}, Passed={data['summary']['passed']}, Failed={data['summary']['failed']}")
        print(f"  Simulated Defect Detected: {stale_defect['potential_defect']}")

    def test_06_demo_mode_without_gemini(self):
        """Verify DEMO_MODE works deterministically without Gemini."""
        original_demo_mode = settings.DEMO_MODE
        try:
            settings.DEMO_MODE = True
            
            # Health in demo mode
            res = self.client.get("/health")
            self.assertEqual(res.status_code, 200)
            self.assertTrue(res.json()["demo_mode"])

            # Analyze in demo mode
            res = self.client.post("/analyze", json={"requirement": DEMO_REQ})
            self.assertEqual(res.status_code, 200)
            self.assertEqual(res.json()["component"], "Telematics ECU")

            # Generate tests in demo mode
            res = self.client.post("/generate-tests", json={"requirement": DEMO_REQ})
            self.assertEqual(res.status_code, 200)
            self.assertGreater(res.json()["count"], 0)

            # Critic in demo mode
            tests = res.json()["tests"]
            res = self.client.post("/critic", json={"requirement": DEMO_REQ, "tests": tests})
            self.assertEqual(res.status_code, 200)
            self.assertIn("coverage_percentage", res.json())

            # Run tests in demo mode
            res = self.client.post("/run-tests", json={"tests": tests})
            self.assertEqual(res.status_code, 200)
            self.assertEqual(res.json()["summary"]["failed"], 1)
            
            print("✓ Demo mode passed: All 5 endpoints function deterministically with DEMO_MODE=True")
        finally:
            settings.DEMO_MODE = original_demo_mode


if __name__ == "__main__":
    unittest.main()
