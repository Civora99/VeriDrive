import { NextRequest, NextResponse } from 'next/server';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const reqText =
      body.requirement?.raw_text ||
      body.requirement_text ||
      (typeof body.requirement === 'string' ? body.requirement : null) ||
      'The telematics ECU shall transmit vehicle GPS position every 10 seconds when ignition is ON and cellular connectivity is available.';

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
    const pyRes = await fetch(`${PYTHON_BACKEND_URL}/critic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requirement: reqText,
        tests: pyTests,
      }),
    });

    if (!pyRes.ok) {
      const err = await pyRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || err.error || 'Python backend critic failed' },
        { status: pyRes.status }
      );
    }

    const pyData = await pyRes.json();

    return NextResponse.json({
      success: true,
      coverage_percentage: pyData.coverage_percentage,
      missing_scenarios: pyData.missing_scenarios,
      covered_categories: pyData.covered_categories,
      duplicate_tests: pyData.duplicate_tests,
      recommendations: pyData.recommendations,
      additional_test_suggestions: pyData.additional_test_suggestions,
      critic_review: {
        coverage_score: pyData.coverage_percentage,
        gaps_identified: pyData.missing_scenarios,
        recommendations: pyData.recommendations,
      },
      py_data: pyData,
    });
  } catch (error: any) {
    console.error('Error querying Python backend /critic:', error);
    return NextResponse.json(
      { error: error?.message || 'Critic review failed' },
      { status: 500 }
    );
  }
}
