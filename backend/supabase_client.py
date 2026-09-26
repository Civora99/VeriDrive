"""
VeriDrive AI - Supabase Backend Database Connector
Provides direct REST-based database persistence and synchronization between 
the Python AI Backend service and the Supabase PostgreSQL database.
Uses Python standard library (urllib.request) for zero external dependencies.
"""

import os
import json
import logging
from typing import Dict, List, Any, Optional
from pathlib import Path
import urllib.request
import urllib.error

# Configure logging
logger = logging.getLogger("veridrive.supabase")
logging.basicConfig(level=logging.INFO)

# Locate environment variables from backend/.env or root .env
def get_env_var(key: str, default: str = "") -> str:
    val = os.getenv(key, "").strip()
    if val:
        return val
    
    # Try reading from root .env or backend .env
    for env_path in [
        Path(__file__).resolve().parent / ".env",
        Path(__file__).resolve().parent.parent / ".env"
    ]:
        if env_path.exists():
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        if k.strip() == key:
                            return v.strip().strip("'\"")
    return default


class SupabaseBackendClient:
    """
    Python client for persisting backend AI models (Requirements, Test Cases,
    Critic Audits, Test Runs, Defects) directly into Supabase.
    """

    def __init__(
        self,
        url: Optional[str] = None,
        key: Optional[str] = None
    ):
        self.url = (url or get_env_var("NEXT_PUBLIC_SUPABASE_URL") or get_env_var("SUPABASE_URL")).rstrip('/')
        self.key = (
            key or 
            get_env_var("SUPABASE_SERVICE_ROLE_KEY") or 
            get_env_var("NEXT_PUBLIC_SUPABASE_ANON_KEY")
        )

    @property
    def is_configured(self) -> bool:
        """Checks if Supabase URL and Key are configured."""
        return bool(self.url and self.key and self.url.startswith("http"))

    def _make_request(
        self,
        method: str,
        endpoint: str,
        payload: Optional[Union[Dict, List]] = None,
        headers_override: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Helper to send HTTP requests to Supabase REST API using urllib."""
        if not self.is_configured:
            return {"status": "skipped", "reason": "not_configured"}

        full_url = f"{self.url}/rest/v1/{endpoint.lstrip('/')}"
        
        req_headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        if headers_override:
            req_headers.update(headers_override)

        data_bytes = None
        if payload is not None:
            data_bytes = json.dumps(payload).encode("utf-8")

        req = urllib.request.Request(
            full_url,
            data=data_bytes,
            headers=req_headers,
            method=method.upper()
        )

        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                body = response.read().decode("utf-8")
                status_code = response.getcode()
                try:
                    res_json = json.loads(body) if body else {}
                except Exception:
                    res_json = {"raw": body}
                
                return {
                    "status": "success",
                    "code": status_code,
                    "data": res_json
                }
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8") if e.fp else ""
            logger.error(f"Supabase HTTPError {e.code}: {err_body}")
            return {
                "status": "error",
                "code": e.code,
                "detail": err_body
            }
        except Exception as e:
            logger.exception("Supabase request exception")
            return {
                "status": "exception",
                "error": str(e)
            }

    def check_connection(self) -> Dict[str, Any]:
        """Verifies connection status with Supabase REST API."""
        if not self.is_configured:
            return {
                "status": "error",
                "message": "Supabase URL or Key not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env"
            }
        
        res = self._make_request("GET", "requirements?select=count")
        if res.get("status") == "success":
            return {
                "status": "connected",
                "url": self.url,
                "tables_reachable": True
            }
        else:
            return {
                "status": "connection_failed",
                "details": res
            }

    # -------------------------------------------------------------------------
    # Requirements Operations
    # -------------------------------------------------------------------------
    def save_requirement(
        self,
        requirement_key: str,
        raw_text: str,
        analysis_data: Optional[Dict[str, Any]] = None,
        component: str = "ECU Subsystem",
        requirement_type: str = "Functional"
    ) -> Dict[str, Any]:
        """Inserts or updates a requirement in the Supabase 'requirements' table."""
        payload = {
            "requirement_key": requirement_key,
            "raw_text": raw_text,
            "component": component,
            "requirement_type": requirement_type,
            "summary": raw_text[:200]
        }

        if analysis_data:
            payload.update({
                "inputs": analysis_data.get("inputs", []),
                "outputs": analysis_data.get("outputs", []),
                "conditions": analysis_data.get("conditions", []),
                "constraints": analysis_data.get("constraints", []),
                "interfaces": analysis_data.get("interfaces", []),
                "dependencies": analysis_data.get("dependencies", []),
                "risks": analysis_data.get("risks", []),
                "component": analysis_data.get("component", component),
                "requirement_type": analysis_data.get("category", requirement_type)
            })

        res = self._make_request(
            "POST",
            "requirements",
            payload=payload,
            headers_override={"Prefer": "resolution=merge-duplicates,return=representation"}
        )

        if res.get("status") == "success":
            data = res.get("data", [])
            req_obj = data[0] if isinstance(data, list) and data else data
            logger.info(f"Successfully saved requirement {requirement_key} to Supabase.")
            return {"status": "success", "data": req_obj}
        return res

    # -------------------------------------------------------------------------
    # Test Cases Operations
    # -------------------------------------------------------------------------
    def save_test_cases(
        self,
        requirement_id_or_key: str,
        test_cases: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Saves a batch of test cases to Supabase 'test_cases' table."""
        req_uuid = self._resolve_requirement_uuid(requirement_id_or_key)
        if not req_uuid:
            req_res = self.save_requirement(requirement_id_or_key, f"Requirement {requirement_id_or_key}")
            if req_res.get("status") == "success" and "data" in req_res:
                req_uuid = req_res["data"].get("id")

        if not req_uuid:
            return {"status": "error", "message": f"Could not resolve requirement UUID for {requirement_id_or_key}"}

        records = []
        for tc in test_cases:
            records.append({
                "requirement_id": req_uuid,
                "test_key": tc.get("test_id", tc.get("id", "TC-001")),
                "title": tc.get("title", "Untitled Test Case"),
                "category": tc.get("category", "Functional"),
                "objective": tc.get("description", tc.get("objective", "")),
                "reason_generated": tc.get("reason_generated", "AI Generated Validation Scenario"),
                "preconditions": json.dumps(tc.get("preconditions", [])),
                "test_steps": tc.get("steps", []),
                "expected_result": tc.get("expected_result", "Pass criteria met"),
                "priority": str(tc.get("priority", "MEDIUM")).upper(),
                "risk_level": str(tc.get("risk", "MEDIUM")).upper(),
                "generated_by": "VeriDrive-Python-Backend"
            })

        res = self._make_request(
            "POST",
            "test_cases",
            payload=records,
            headers_override={"Prefer": "resolution=merge-duplicates,return=representation"}
        )

        if res.get("status") == "success":
            logger.info(f"Successfully saved {len(records)} test cases to Supabase.")
            return {"status": "success", "count": len(records), "data": res.get("data")}
        return res

    # -------------------------------------------------------------------------
    # Test Run & Simulation Results Operations
    # -------------------------------------------------------------------------
    def save_test_run_results(
        self,
        requirement_key: str,
        run_name: str,
        test_results: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Saves simulated execution runs to 'test_runs' table."""
        req_uuid = self._resolve_requirement_uuid(requirement_key)
        if not req_uuid:
            req_res = self.save_requirement(requirement_key, f"Requirement {requirement_key}")
            req_uuid = req_res.get("data", {}).get("id")

        passed = sum(1 for r in test_results if r.get("status") in ("PASS", "PASSED"))
        failed = sum(1 for r in test_results if r.get("status") in ("FAIL", "FAILED"))
        blocked = sum(1 for r in test_results if r.get("status") == "BLOCKED")

        run_payload = {
            "requirement_id": req_uuid,
            "run_name": run_name,
            "total_tests": len(test_results),
            "passed": passed,
            "failed": failed,
            "blocked": blocked,
            "simulated": True
        }

        res = self._make_request("POST", "test_runs", payload=run_payload)
        if res.get("status") == "success":
            run_data = res.get("data", [])
            run_obj = run_data[0] if isinstance(run_data, list) and run_data else run_data
            return {"status": "success", "run_id": run_obj.get("id"), "summary": run_payload}
        return res

    # -------------------------------------------------------------------------
    # Helper Utilities
    # -------------------------------------------------------------------------
    def _resolve_requirement_uuid(self, req_key_or_id: str) -> Optional[str]:
        """Looks up the UUID for a requirement given its requirement_key."""
        if len(req_key_or_id) == 36 and "-" in req_key_or_id:
            return req_key_or_id

        res = self._make_request("GET", f"requirements?requirement_key=eq.{req_key_or_id}&select=id")
        if res.get("status") == "success":
            data = res.get("data", [])
            if data and isinstance(data, list) and len(data) > 0:
                return data[0]["id"]
        return None

# Instantiated default client singleton
supabase_backend_client = SupabaseBackendClient()
