import { NextRequest, NextResponse } from 'next/server';
import { generateTestSuiteWithAI } from '@/lib/ai/gemini';
import { auditTestCase } from '@/lib/validation/testRules';
import { saveTestCases, getRequirementById } from '@/lib/supabase/queries';
import { StructuredRequirement } from '@/lib/types/requirements';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requirement, req_id } = body;

    let targetReq: StructuredRequirement | null = requirement || null;

    if (!targetReq && req_id) {
      targetReq = await getRequirementById(req_id);
    }

    if (!targetReq) {
      return NextResponse.json(
        { error: 'Valid requirement object or req_id is required' },
        { status: 400 }
      );
    }

    const testCases = await generateTestSuiteWithAI(targetReq);
    const audits = testCases.map((tc) => auditTestCase(tc));

    await saveTestCases(targetReq.id, testCases);

    return NextResponse.json({
      success: true,
      req_id: targetReq.id,
      count: testCases.length,
      test_cases: testCases,
      audits
    });
  } catch (error: any) {
    console.error('Error in /api/generate-tests:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate test suite' },
      { status: 500 }
    );
  }
}
