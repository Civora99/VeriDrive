import { NextRequest, NextResponse } from 'next/server';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const reqText = body.requirement || body.raw_text || body.text;

    if (!reqText || typeof reqText !== 'string' || reqText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Please provide requirement text in request body' },
        { status: 400 }
      );
    }

    // Query Python FastAPI backend
    const pyRes = await fetch(`${PYTHON_BACKEND_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requirement: reqText.trim() }),
    });

    if (!pyRes.ok) {
      const err = await pyRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || err.error || 'Python backend analysis failed' },
        { status: pyRes.status }
      );
    }

    const pyData = await pyRes.json();

    // Map to frontend requirement format
    const mappedRequirement = {
      id: pyData.requirement_id || 'REQ-001',
      title: pyData.requirement_text?.slice(0, 100) || 'Automotive Software Requirement',
      raw_text: pyData.requirement_text,
      ecu: pyData.component || 'Telematics ECU',
      asil_level: 'ASIL-B',
      category: pyData.category || 'Functional + Timing',
      inputs: (pyData.inputs || []).map((inp: string) => ({ name: inp, type: 'signal' })),
      outputs: (pyData.outputs || []).map((out: string) => ({ name: out, type: 'telemetry' })),
      triggers: pyData.conditions || [],
      conditions: pyData.conditions || [],
      timing_constraints: (pyData.constraints || []).map((c: string) => ({
        metric: c,
        max_latency_ms: 10000,
      })),
      interfaces: pyData.interfaces || [],
      dependencies: pyData.dependencies || [],
      failure_conditions: pyData.risks || [],
      safety_related_wording: [],
      diagnostic_implications: [],
      risk_score: 75,
      confidence_score: 95,
      created_at: new Date().toISOString(),
      status: 'Analyzed',
    };

    return NextResponse.json({
      success: true,
      requirement: mappedRequirement,
      py_data: pyData,
    });
  } catch (error: any) {
    console.error('Error querying Python backend /analyze:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to query Python backend' },
      { status: 500 }
    );
  }
}
