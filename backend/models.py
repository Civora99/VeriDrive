from typing import List, Optional, Literal, Any, Dict, Union
from pydantic import BaseModel, Field, ConfigDict

# Valid test categories specified in automotive validation
ValidCategory = Literal[
    "Functional",
    "Boundary",
    "Negative",
    "Timing",
    "Communication",
    "Diagnostic",
    "Recovery",
    "Cross-ECU",
    "Fault Injection",
]

# Valid test priorities
ValidPriority = Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]

# ---------------------------------------------------------------------------
# 1. /analyze models
# ---------------------------------------------------------------------------
class AnalyzeRequest(BaseModel):
    requirement: str = Field(
        ...,
        description="Raw embedded vehicle software requirement text",
        min_length=5
    )


class RequirementAnalysis(BaseModel):
    model_config = ConfigDict(extra="ignore")
    requirement_id: str = Field(default="REQ-001", description="Standardized requirement ID")
    requirement_text: str = Field(..., description="Original requirement statement")
    component: str = Field(default="Unknown", description="Target automotive ECU / subsystem")
    category: str = Field(default="Functional", description="Engineering category (e.g. Functional + Timing)")
    interfaces: List[str] = Field(default_factory=list, description="Communication/hardware interfaces")
    inputs: List[str] = Field(default_factory=list, description="Inputs or signals")
    outputs: List[str] = Field(default_factory=list, description="Outputs or emitted signals")
    constraints: List[str] = Field(default_factory=list, description="Timing, electrical, or operational constraints")
    dependencies: List[str] = Field(default_factory=list, description="Hardware or inter-ECU dependencies")
    risks: List[str] = Field(default_factory=list, description="Failure modes, safety or operational risks")
    conditions: List[str] = Field(default_factory=list, description="Preconditions and operational criteria")

# ---------------------------------------------------------------------------
# 2. /generate-tests models
# ---------------------------------------------------------------------------
class TestCase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    test_id: str = Field(default="TC-001", description="Unique test case identifier (e.g., TC-001)")
    requirement_id: str = Field(default="REQ-001", description="Traceable requirement ID")
    title: str = Field(default="Validation Scenario", description="Concise engineering test case title")
    category: str = Field(default="Functional", description="Automotive validation category")
    priority: str = Field(default="HIGH", description="Execution priority: LOW, MEDIUM, HIGH, CRITICAL")
    risk: str = Field(default="HIGH", description="Associated risk level: LOW, MEDIUM, HIGH, CRITICAL")
    preconditions: List[str] = Field(default_factory=list, description="Prerequisite conditions before test execution")
    steps: List[str] = Field(default_factory=list, description="Step-by-step test procedure")
    expected_result: str = Field(default="Deterministic verification criterion", description="Deterministic pass/fail criterion")
    reason_generated: str = Field(default="Automotive verification", description="Engineering rationale for generating this specific test")

class GenerateTestsRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    requirement: str = Field(..., description="Requirement text to generate tests for", min_length=5)
    analysis: Optional[Any] = Field(
        default=None,
        description="Optional structured analysis previously produced by /analyze"
    )

class GenerateTestsResponse(BaseModel):
    requirement_id: str
    tests: List[TestCase]
    test_cases: List[TestCase] = Field(
        default_factory=list,
        description="Alias for tests for frontend compatibility"
    )
    count: int
    disclaimer: str = (
        "These are AI-generated validation scenarios for engineer review, "
        "not formal ISO 26262 certification or vehicle validation approval."
    )

# ---------------------------------------------------------------------------
# 3. /critic models
# ---------------------------------------------------------------------------
class CriticRequest(BaseModel):
    requirement: str = Field(..., description="The original requirement statement", min_length=5)
    tests: Optional[List[TestCase]] = Field(default_factory=list, description="Generated test cases to critique")
    test_cases: Optional[List[TestCase]] = Field(default_factory=list, description="Alias for tests")

    def get_all_tests(self) -> List[TestCase]:
        if self.tests and len(self.tests) > 0:
            return self.tests
        return self.test_cases or []

class CriticResponse(BaseModel):
    coverage_percentage: int = Field(
        ...,
        ge=0,
        le=100,
        description="AI-estimated scenario coverage metric (NOT formal verification coverage)"
    )
    covered_categories: List[str] = Field(default_factory=list, description="Categories covered in the suite")
    missing_scenarios: List[str] = Field(default_factory=list, description="Identified missing validation scenarios")
    duplicate_tests: List[str] = Field(default_factory=list, description="Redundant or duplicate test IDs")
    weak_tests: List[str] = Field(default_factory=list, description="Tests with vague steps or ambiguous expected results")
    recommendations: List[str] = Field(default_factory=list, description="Actionable recommendations to harden the suite")
    additional_test_suggestions: List[TestCase] = Field(
        default_factory=list,
        description="Structured tests addressing critical missing scenarios"
    )
    coverage_note: str = (
        "The coverage percentage is an AI-estimated scenario coverage metric. "
        "It is NOT formal ISO 26262 verification coverage."
    )

# ---------------------------------------------------------------------------
# 4. /run-tests models
# ---------------------------------------------------------------------------
class RunTestsRequest(BaseModel):
    tests: Optional[List[TestCase]] = Field(default_factory=list, description="Test cases to simulate execution for")
    test_cases: Optional[List[TestCase]] = Field(default_factory=list, description="Alias for tests")

    def get_all_tests(self) -> List[TestCase]:
        if self.tests and len(self.tests) > 0:
            return self.tests
        return self.test_cases or []

class TestRunResult(BaseModel):
    test_id: str
    status: Literal["PASS", "FAIL", "BLOCKED"]
    observed_result: str
    failure_reason: Optional[str] = None
    potential_defect: Optional[str] = None

class RunTestsResponse(BaseModel):
    run_id: str = Field(default="RUN-001", description="Simulated execution run identifier")
    results: List[TestRunResult]
    summary: dict = Field(default_factory=dict, description="Summary counts of results")
    simulation_note: str = (
        "SIMULATED execution only for hackathon demonstration. "
        "Does not imply real vehicle or HIL bench execution."
    )

# ---------------------------------------------------------------------------
# 5. /health model
# ---------------------------------------------------------------------------
class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "PACCAR TestPilot AI"
    version: str = "1.0.0"
    demo_mode: bool = False
