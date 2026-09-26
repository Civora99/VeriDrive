/**
 * Python Backend Client (FastAPI on http://127.0.0.1:8000)
 * Directly connects frontend to the Python validation engine.
 */

const PYTHON_BACKEND_URL = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 'http://127.0.0.1:8000';

export interface PythonRequirementAnalysis {
  requirement_id: string;
  requirement_text: string;
  component: string;
  category: string;
  interfaces: string[];
  inputs: string[];
  outputs: string[];
  constraints: string[];
  dependencies: string[];
  risks: string[];
  conditions: string[];
}

export interface PythonTestCase {
  test_id: string;
  requirement_id: string;
  title: string;
  category: string;
  priority: string;
  risk: string;
  preconditions: string[];
  steps: string[];
  expected_result: string;
  reason_generated: string;
}

export interface PythonGenerateTestsResponse {
  requirement_id: string;
  tests: PythonTestCase[];
  count: number;
  disclaimer: string;
}

export interface PythonCriticResponse {
  coverage_percentage: number;
  covered_categories: string[];
  missing_scenarios: string[];
  duplicate_tests: string[];
  weak_tests: string[];
  recommendations: string[];
  additional_test_suggestions: PythonTestCase[];
  coverage_note: string;
}

export interface PythonTestRunResult {
  test_id: string;
  status: 'PASS' | 'FAIL' | 'BLOCKED';
  observed_result: string;
  failure_reason: string | null;
  potential_defect: string | null;
}

export interface PythonRunTestsResponse {
  run_id: string;
  results: PythonTestRunResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    blocked: number;
  };
  simulation_note: string;
}

/**
 * 1. POST /analyze
 */
export async function pyAnalyzeRequirement(requirementText: string): Promise<PythonRequirementAnalysis> {
  const res = await fetch(`${PYTHON_BACKEND_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requirement: requirementText }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Python backend /analyze error (${res.status})`);
  }

  return res.json();
}

/**
 * 2. POST /generate-tests
 */
export async function pyGenerateTests(
  requirementText: string,
  analysis?: PythonRequirementAnalysis
): Promise<PythonGenerateTestsResponse> {
  const res = await fetch(`${PYTHON_BACKEND_URL}/generate-tests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requirement: requirementText,
      analysis: analysis || undefined,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Python backend /generate-tests error (${res.status})`);
  }

  return res.json();
}

/**
 * 3. POST /critic
 */
export async function pyCriticTests(
  requirementText: string,
  tests: PythonTestCase[]
): Promise<PythonCriticResponse> {
  const res = await fetch(`${PYTHON_BACKEND_URL}/critic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requirement: requirementText,
      tests,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Python backend /critic error (${res.status})`);
  }

  return res.json();
}

/**
 * 4. POST /run-tests
 */
export async function pyRunTests(tests: PythonTestCase[]): Promise<PythonRunTestsResponse> {
  const res = await fetch(`${PYTHON_BACKEND_URL}/run-tests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tests }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Python backend /run-tests error (${res.status})`);
  }

  return res.json();
}

/**
 * 5. GET /health
 */
export async function pyCheckHealth(): Promise<{ status: string; service: string; version: string; demo_mode: boolean }> {
  const res = await fetch(`${PYTHON_BACKEND_URL}/health`);
  if (!res.ok) {
    throw new Error(`Python backend /health error (${res.status})`);
  }
  return res.json();
}
