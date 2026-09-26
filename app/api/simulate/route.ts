import { NextRequest, NextResponse } from 'next/server';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawTests = body.tests || body.test_cases || [];

    // Map to Python TestCase format
    const pyTests = rawTests.map((t: any) => ({
      test_id: t.id || t.test_id || 'TC-001',
      requirement_id: t.req_id || 'REQ-001',
      title: t.title || 'Validation Scenario',
      category: t.category || 'Functional',
      priority: t.priority || 'HIGH',
      risk: t.risk || 'MEDIUM',
      preconditions: Array.isArray(t.preconditions) ? t.preconditions : [t.preconditions || 'Ignition ON'],
      steps: (t.steps || []).map((s: any) => typeof s === 'string' ? s : s.action),
      expected_result: t.expected_result || t.expected_results?.[0]?.expectation || 'Telemetry transmitted',
      reason_generated: t.reason_generated || t.why_generated || t.description || 'Validation coverage',
    }));

    // Query Python FastAPI backend
    const pyRes = await fetch(`${PYTHON_BACKEND_URL}/run-tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tests: pyTests }),
    });

    if (!pyRes.ok) {
      const err = await pyRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || err.error || 'Python backend run-tests failed' },
        { status: pyRes.status }
      );
    }

    const pyData = await pyRes.json();

    return NextResponse.json({
      success: true,
      run_id: pyData.run_id,
      results: pyData.results,
      summary: pyData.summary,
      simulation_note: pyData.simulation_note,
      py_data: pyData,
    });
  } catch (error: any) {
    console.error('Error querying Python backend /run-tests:', error);
    return NextResponse.json(
      { error: error?.message || 'Simulation execution failed' },
      { status: 500 }
    );
  }
}
