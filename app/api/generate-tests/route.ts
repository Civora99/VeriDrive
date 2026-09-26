import { NextRequest, NextResponse } from 'next/server';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const reqText =
      body.requirement?.raw_text ||
      body.requirement_text ||
      (typeof body.requirement === 'string' ? body.requirement : null) ||
      body.raw_text ||
      'The telematics ECU shall transmit vehicle GPS position every 10 seconds when ignition is ON and cellular connectivity is available.';

    const analysis = body.analysis || (typeof body.requirement === 'object' ? body.requirement : undefined);

    // Query Python FastAPI backend
    const pyRes = await fetch(`${PYTHON_BACKEND_URL}/generate-tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requirement: reqText,
        analysis: analysis ? {
          requirement_id: analysis.id || 'REQ-001',
          requirement_text: reqText,
          component: analysis.ecu || 'Telematics ECU',
          category: analysis.category || 'Functional + Timing',
          interfaces: analysis.interfaces || ['GPS', 'Cellular', 'Cloud'],
          inputs: (analysis.inputs || []).map((i: any) => typeof i === 'string' ? i : i.name),
          outputs: (analysis.outputs || []).map((o: any) => typeof o === 'string' ? o : o.name),
          constraints: (analysis.timing_constraints || []).map((t: any) => t.metric || '10s'),
          dependencies: analysis.dependencies || [],
          risks: analysis.failure_conditions || [],
          conditions: analysis.conditions || []
        } : undefined
      }),
    });

    if (!pyRes.ok) {
      const err = await pyRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || err.error || 'Python backend test generation failed' },
        { status: pyRes.status }
      );
    }

    const pyData = await pyRes.json();

    // Map to frontend test cases format
    const mappedTests = (pyData.tests || []).map((t: any, index: number) => ({
      id: t.test_id,
      test_id: t.test_id,
      req_id: pyData.requirement_id || 'REQ-001',
      title: t.title,
      description: t.description || t.reason_generated,
      category: t.category,
      priority: t.priority,
      risk: t.risk,
      status: t.test_id === 'TC-007' ? 'Failed' : 'Ready',
      preconditions: Array.isArray(t.preconditions) ? t.preconditions : [t.preconditions || 'Ignition ON'],
      steps: (t.steps || []).map((stepStr: string, sIdx: number) => ({
        step_num: sIdx + 1,
        action: stepStr,
        dwell_time_ms: 100,
      })),
      expected_results: [
        {
          check_num: 1,
          expectation: t.expected_result,
          max_latency_ms: 10000,
        },
      ],
      expected_result: t.expected_result,
      reason_generated: t.reason_generated,
      why_generated: t.reason_generated,
      coverage_tags: [t.category, t.priority, 'Python-Generated'],
      cleanup: ['Quiesce test bench.'],
      critic_score: 95,
      revised_by_critic: false,
    }));

    return NextResponse.json({
      success: true,
      req_id: pyData.requirement_id,
      count: mappedTests.length,
      test_cases: mappedTests,
      tests: mappedTests,
      py_data: pyData,
    });
  } catch (error: any) {
    console.error('Error querying Python backend /generate-tests:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to query Python test generator' },
      { status: 500 }
    );
  }
}
