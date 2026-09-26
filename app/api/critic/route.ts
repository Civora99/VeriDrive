import { NextRequest, NextResponse } from 'next/server';
import { critiqueTestSuiteWithAI } from '@/lib/ai/gemini';
import {
  saveTestCases,
  saveCriticReview,
  getRequirementById,
  getTestCasesForRequirement
} from '@/lib/supabase/queries';
import { StructuredRequirement } from '@/lib/types/requirements';
import { TestCase } from '@/lib/types/tests';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requirement, test_cases, req_id } = body;

    let targetReq: StructuredRequirement | null = requirement || null;
    let targetTests: TestCase[] = test_cases || [];

    if (!targetReq && req_id) {
      targetReq = await getRequirementById(req_id);
    }

    if (targetTests.length === 0 && req_id) {
      targetTests = await getTestCasesForRequirement(req_id);
    }

    if (!targetReq || targetTests.length === 0) {
      return NextResponse.json(
        { error: 'Valid requirement and non-empty test_cases array are required for critic review' },
        { status: 400 }
      );
    }

    const { critic_review, revised_test_cases } = await critiqueTestSuiteWithAI(
      targetReq,
      targetTests
    );

    await saveTestCases(targetReq.id, revised_test_cases);
    await saveCriticReview(critic_review);

    return NextResponse.json({
      success: true,
      critic_review,
      revised_test_cases,
      improved_count: revised_test_cases.filter((t) => t.revised_by_critic).length
    });
  } catch (error: any) {
    console.error('Error in /api/critic:', error);
    return NextResponse.json(
      { error: error?.message || 'Critic review failed' },
      { status: 500 }
    );
  }
}
