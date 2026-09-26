import uuid
import logging
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from models import (
    AnalyzeRequest,
    RequirementAnalysis,
    GenerateTestsRequest,
    GenerateTestsResponse,
    CriticRequest,
    CriticResponse,
    RunTestsRequest,
    RunTestsResponse,
    TestRunResult,
    HealthResponse,
    TestCase,
)
from prompts import ANALYZE_REQUIREMENT_SYSTEM_PROMPT
from gemini_service import gemini_service
from test_generator import generate_tests_suite, is_demo_requirement
from critic import evaluate_test_suite

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("paccar.api")

app = FastAPI(
    title="PACCAR TestPilot AI - Automotive Validation Engine",
    description=(
        "AI-powered embedded automotive software requirement analysis, "
        "test generation, quality critique, and simulated validation execution."
    ),
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# ---------------------------------------------------------------------------
# CORS Configuration
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Custom Exception Handlers
# ---------------------------------------------------------------------------
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "status_code": exc.status_code}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception processing %s: %s", request.url.path, str(exc), exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "An internal error occurred in PACCAR TestPilot AI backend.", "status_code": 500}
    )

# ---------------------------------------------------------------------------
# Standard Deterministic Demo Requirement Analysis
# ---------------------------------------------------------------------------
DEMO_REQUIREMENT_ANALYSIS = RequirementAnalysis(
    requirement_id="REQ-001",
    requirement_text="The telematics ECU shall transmit vehicle GPS position every 10 seconds when ignition is ON and cellular connectivity is available.",
    component="Telematics ECU",
    category="Functional + Timing",
    interfaces=["GPS", "Cellular", "Cloud"],
    inputs=["Ignition", "GPS"],
    outputs=["Vehicle Position"],
    constraints=["10 seconds", "Ignition ON"],
    dependencies=["GPS", "Cellular Network", "Cloud"],
    risks=["GPS unavailable", "Cellular network unavailable", "ECU restart"],
    conditions=["Ignition ON", "Cellular connection available"]
)

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health", response_model=HealthResponse, tags=["System"])
def health_check():
    """Service health and diagnostic status."""
    return HealthResponse(
        status="ok",
        service=settings.PROJECT_NAME,
        version=settings.VERSION,
        demo_mode=settings.DEMO_MODE or not gemini_service.is_available()
    )


@app.post("/analyze", response_model=RequirementAnalysis, tags=["Requirements"])
def analyze_requirement(payload: AnalyzeRequest):
    """
    Analyzes embedded automotive software requirement text.
    Extracts components, category, interfaces, inputs/outputs, constraints, dependencies, and risks.
    """
    req_text = payload.requirement.strip()
    if not req_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Requirement text cannot be empty."
        )

    # Deterministic demo response check
    if settings.DEMO_MODE or not gemini_service.is_available() or is_demo_requirement(req_text):
        logger.info("Serving deterministic analysis for requirement: %s", req_text[:60])
        return DEMO_REQUIREMENT_ANALYSIS

    # Live Gemini analysis
    try:
        data = gemini_service.generate_structured_response(
            prompt=f"Requirement Text:\n{req_text}",
            system_instruction=ANALYZE_REQUIREMENT_SYSTEM_PROMPT
        )
        return RequirementAnalysis(
            requirement_id=data.get("requirement_id", "REQ-001"),
            requirement_text=req_text,
            component=data.get("component", "Unknown"),
            category=data.get("category", "Functional"),
            interfaces=data.get("interfaces", []),
            inputs=data.get("inputs", []),
            outputs=data.get("outputs", []),
            constraints=data.get("constraints", []),
            dependencies=data.get("dependencies", []),
            risks=data.get("risks", []),
            conditions=data.get("conditions", [])
        )
    except RuntimeError as re:
        if "unavailable" in str(re).lower():
            logger.warning("Gemini unavailable, falling back to demo analysis: %s", str(re))
            return DEMO_REQUIREMENT_ANALYSIS
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(re))
    except Exception as e:
        logger.error("Failed to analyze requirement with Gemini: %s", str(e))
        # Fall back gracefully to demo analysis if related to telematics
        if "telematics" in req_text.lower():
            return DEMO_REQUIREMENT_ANALYSIS
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="AI requirement analysis failed.")


@app.post("/generate-tests", response_model=GenerateTestsResponse, tags=["Test Generation"])
def generate_tests(payload: GenerateTestsRequest):
    """
    Generates a concise, comprehensive automotive test suite covering functional,
    boundary, negative, timing, communication, fault, and recovery scenarios.
    """
    req_text = payload.requirement.strip()
    if not req_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Requirement text cannot be empty."
        )

    try:
        response = generate_tests_suite(req_text, payload.analysis)
        return response
    except Exception as e:
        logger.error("Test generation error: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Test generation failed: {str(e)}"
        )


@app.post("/critic", response_model=CriticResponse, tags=["Quality & Audit"])
def critique_tests(payload: CriticRequest):
    """
    Evaluates generated test suite coverage against automotive verification guidelines.
    Identifies missing edge cases, redundancies, and weak criteria.
    """
    req_text = payload.requirement.strip()
    all_tests = payload.get_all_tests()

    if not req_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Requirement text cannot be empty."
        )

    if not all_tests:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A non-empty list of tests must be provided for critique."
        )

    try:
        response = evaluate_test_suite(req_text, all_tests)
        return response
    except Exception as e:
        logger.error("Critic evaluation error: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Critic review failed: {str(e)}"
        )


@app.post("/run-tests", response_model=RunTestsResponse, tags=["Simulated Execution"])
def run_tests(payload: RunTestsRequest):
    """
    Simulates automotive test bench execution for demonstration.
    Returns deterministic results including a realistic defect detection on stale data handling.
    """
    all_tests = payload.get_all_tests()
    if not all_tests:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No test cases provided to execute."
        )

    results: List[TestRunResult] = []
    run_id = f"RUN-{uuid.uuid4().hex[:6].upper()}"

    for tc in all_tests:
        test_id = tc.test_id
        title_lower = tc.title.lower()
        reason_lower = tc.reason_generated.lower()

        # Check for our intentional demo defect on stale/frozen GPS data
        is_stale_data_test = (
            "stale" in title_lower or
            "frozen" in title_lower or
            test_id in ("TC-004", "TC-007") and "stale" in (tc.expected_result.lower() + title_lower)
        )

        if is_stale_data_test:
            results.append(
                TestRunResult(
                    test_id=test_id,
                    status="FAIL",
                    observed_result="Stale GPS position transmitted after GPS signal froze; payload lacked warning flag.",
                    failure_reason="ECU firmware failed to assert data invalidity flag when coordinate buffer ceased updating.",
                    potential_defect="Stale-data handling defect in telematics position manager."
                )
            )
        elif tc.category == "Timing":
            results.append(
                TestRunResult(
                    test_id=test_id,
                    status="PASS",
                    observed_result="Telemetry interval measured at 10.04s (jitter ±80ms), strictly within ±500ms allowance.",
                    failure_reason=None,
                    potential_defect=None
                )
            )
        elif tc.category == "Negative":
            results.append(
                TestRunResult(
                    test_id=test_id,
                    status="PASS",
                    observed_result="GPS antenna disconnect detected; GPS_INVALID flag asserted and invalid transmission suppressed.",
                    failure_reason=None,
                    potential_defect=None
                )
            )
        elif tc.category == "Communication":
            results.append(
                TestRunResult(
                    test_id=test_id,
                    status="PASS",
                    observed_result="Cellular drop simulated; 6 GPS coordinate frames queued into non-volatile ring buffer without drop.",
                    failure_reason=None,
                    potential_defect=None
                )
            )
        elif tc.category == "Recovery":
            results.append(
                TestRunResult(
                    test_id=test_id,
                    status="PASS",
                    observed_result="Cellular network restored; connection re-established in 2.8s and queued frames delivered.",
                    failure_reason=None,
                    potential_defect=None
                )
            )
        elif tc.category == "Fault Injection":
            results.append(
                TestRunResult(
                    test_id=test_id,
                    status="PASS",
                    observed_result="Power cycle complete; telematics boot finished in 8.1s, telemetry resumed within 11.4s.",
                    failure_reason=None,
                    potential_defect=None
                )
            )
        else:
            # Default Functional / other scenarios
            results.append(
                TestRunResult(
                    test_id=test_id,
                    status="PASS",
                    observed_result=f"Observed nominal telemetry transmission conforming to expected criteria ({tc.expected_result[:80]}...).",
                    failure_reason=None,
                    potential_defect=None
                )
            )

    passed_count = sum(1 for r in results if r.status == "PASS")
    failed_count = sum(1 for r in results if r.status == "FAIL")

    return RunTestsResponse(
        run_id=run_id,
        results=results,
        summary={
            "total": len(results),
            "passed": passed_count,
            "failed": failed_count,
            "blocked": 0
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
