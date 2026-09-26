import logging
from typing import List
from models import (
    TestCase,
    CriticResponse,
)
from prompts import CRITIC_SYSTEM_PROMPT
from gemini_service import gemini_service
from test_generator import is_demo_requirement
from config import settings

logger = logging.getLogger("paccar.critic")

DEMO_ADDITIONAL_SUGGESTIONS: List[TestCase] = [
    TestCase(
        test_id="TC-REC-001",
        requirement_id="REQ-001",
        title="Cellular reconnection telemetry recovery after tunnel outage",
        category="Recovery",
        priority="HIGH",
        risk="HIGH",
        preconditions=[
            "Vehicle simulated passing through tunnel with 45-second cellular loss",
            "Ignition active, GPS fix intact"
        ],
        steps=[
            "1. Restore cellular RF connectivity after 45 seconds of dead zone.",
            "2. Observe TCP/TLS connection re-handshake and MQTT ping response.",
            "3. Verify queued telemetry buffer is transmitted prior to fresh 10s packet."
        ],
        expected_result="Connection recovered within 3.5 seconds; buffered coordinates delivered in FIFO order without duplicates.",
        reason_generated="Fills critical missing scenario for transient network loss common on freight highway corridors."
    )
]

def evaluate_test_suite(requirement: str, tests: List[TestCase]) -> CriticResponse:
    """
    Evaluates test suite coverage, redundancy, and quality.
    """
    categories_present = sorted(list({t.category for t in tests if t.category}))

    # Fallback / deterministic evaluation if demo mode or Gemini unavailable
    if settings.DEMO_MODE or not gemini_service.is_available() or (is_demo_requirement(requirement) and len(tests) <= 4):
        has_recovery = any(t.category == "Recovery" for t in tests)
        missing = []
        recommendations = []
        additional = []

        if not has_recovery:
            missing.append("Cellular recovery and buffered telemetry flush after network restoration")
            recommendations.append("Add a recovery scenario to verify uplink re-establishment when network returns.")
            additional.extend(DEMO_ADDITIONAL_SUGGESTIONS)
        
        has_diagnostic = any(t.category == "Diagnostic" for t in tests)
        if not has_diagnostic and "telematics" in requirement.lower():
            missing.append("Diagnostic trouble code (DTC) logging on persistent GPS failure")
            recommendations.append("Add a diagnostic check verifying ISO 14229 UDS DTC confirmation upon sensor disconnect.")

        coverage = 90 if (has_recovery and len(categories_present) >= 5) else 82

        return CriticResponse(
            coverage_percentage=coverage,
            covered_categories=categories_present or ["Functional", "Timing", "Negative"],
            missing_scenarios=missing if missing else ["Extended high-temperature thermal throttling during transmission"],
            duplicate_tests=[],
            weak_tests=[],
            recommendations=recommendations if recommendations else [
                "Consider validating under lower battery voltage boundary (KL30 at 9.0V DC)."
            ],
            additional_test_suggestions=additional
        )

    # Live Gemini evaluation
    prompt = f"Requirement:\n{requirement}\n\nGenerated Test Suite:\n"
    for t in tests:
        prompt += f"- ID: {t.test_id} | Category: {t.category} | Title: {t.title}\n"
        prompt += f"  Expected: {t.expected_result}\n\n"

    try:
        data = gemini_service.generate_structured_response(
            prompt=prompt,
            system_instruction=CRITIC_SYSTEM_PROMPT
        )

        cov_pct = int(data.get("coverage_percentage", 85))
        cov_pct = max(0, min(100, cov_pct))

        raw_suggestions = data.get("additional_test_suggestions", [])
        parsed_suggestions: List[TestCase] = []
        for i, s in enumerate(raw_suggestions):
            if isinstance(s, dict):
                parsed_suggestions.append(
                    TestCase(
                        test_id=s.get("test_id") or f"TC-SUGG-{i+1:03d}",
                        requirement_id=s.get("requirement_id") or "REQ-001",
                        title=s.get("title", f"Suggested Scenario {i+1}"),
                        category=s.get("category", "Recovery"),
                        priority=s.get("priority", "HIGH"),
                        risk=s.get("risk", "HIGH"),
                        preconditions=s.get("preconditions", []),
                        steps=s.get("steps", []),
                        expected_result=s.get("expected_result", "Deterministic pass criterion"),
                        reason_generated=s.get("reason_generated", "Critic recommended test")
                    )
                )

        return CriticResponse(
            coverage_percentage=cov_pct,
            covered_categories=data.get("covered_categories", categories_present),
            missing_scenarios=data.get("missing_scenarios", []),
            duplicate_tests=data.get("duplicate_tests", []),
            weak_tests=data.get("weak_tests", []),
            recommendations=data.get("recommendations", []),
            additional_test_suggestions=parsed_suggestions
        )

    except Exception as e:
        logger.warning("Gemini critic evaluation failed (%s), returning domain-rule evaluation.", str(e))
        return CriticResponse(
            coverage_percentage=85,
            covered_categories=categories_present,
            missing_scenarios=["Cellular recovery after network restoration"],
            duplicate_tests=[],
            weak_tests=[],
            recommendations=["Add a recovery scenario after cellular connectivity returns."],
            additional_test_suggestions=DEMO_ADDITIONAL_SUGGESTIONS
        )

