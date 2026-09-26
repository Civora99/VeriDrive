/**
 * Python Backend Client (FastAPI on http://127.0.0.1:8000)
 * Directly connects frontend to the Python AI validation engine.
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

/**
 * 1. POST /analyze
 * Ingests requirement text and extracts structured automotive engineering attributes.
 */
export async function pyAnalyzeRequirement(requirementText: string): Promise<PythonRequirementAnalysis> {
  const res = await fetch(`${PYTHON_BACKEND_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requirement: requirementText }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || `Python backend /analyze error (${res.status})`);
  }

  return res.json();
}

/**
 * 2. POST /generate-tests
 * Synthesizes a comprehensive 7-scenario automotive validation test suite.
 */
export async function pyGenerateTests(
  requirementText: string,
  analysis?: any
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
    throw new Error(err.detail || err.error || `Python backend /generate-tests error (${res.status})`);
  }

  return res.json();
}

/**
 * 3. POST /critic
 * Evaluates test suite coverage against ISO 26262/ASPICE principles and suggests missing scenarios.
 */
export async function pyCriticTests(
  requirementText: string,
  tests: any[]
): Promise<PythonCriticResponse> {
  const res = await fetch(`${PYTHON_BACKEND_URL}/critic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requirement: requirementText,
      tests: tests.map((t) => ({
        test_id: t.test_id || t.id,
        requirement_id: t.requirement_id || t.req_id || 'REQ-001',
        title: t.title,
        category: t.category,
        priority: t.priority,
        risk: t.risk,
        preconditions: Array.isArray(t.preconditions) ? t.preconditions : [t.preconditions || 'Ignition ON'],
        steps: (t.steps || []).map((s: any) => (typeof s === 'string' ? s : s.action || String(s))),
        expected_result: t.expected_result || t.expected_results?.[0]?.expectation || '',
        reason_generated: t.reason_generated || t.why_generated || t.description || 'Validation scenario',
      })),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || `Python backend /critic error (${res.status})`);
  }

  return res.json();
}

/**
 * 4. GET /health
 * Diagnostic health check.
 */
export async function pyCheckHealth(): Promise<{ status: string; service: string; version: string; demo_mode: boolean }> {
  const res = await fetch(`${PYTHON_BACKEND_URL}/health`);
  if (!res.ok) {
    throw new Error(`Python backend /health error (${res.status})`);
  }
  return res.json();
}
