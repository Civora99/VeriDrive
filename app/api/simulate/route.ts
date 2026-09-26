import { NextRequest, NextResponse } from 'next/server';
import { runSimulationForSuite } from '@/lib/simulation/simulator';
import {
  saveExecutionSummary,
  getTestCasesForRequirement,
  getRequirementById
} from '@/lib/supabase/queries';
import { TestCase } from '@/lib/types/tests';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { req_id, test_cases, induce_defect } = body;

    let targetTests: TestCase[] = test_cases || [];

    if (targetTests.length === 0 && req_id) {
      targetTests = await getTestCasesForRequirement(req_id);
    }

    if (targetTests.length === 0) {
      return NextResponse.json(
        { error: 'No test cases found to simulate execution' },
        { status: 400 }
      );
    }

    const summary = runSimulationForSuite(req_id || targetTests[0].req_id, targetTests, {
      induceDefect: induce_defect !== false
    });

    await saveExecutionSummary(summary);

    return NextResponse.json({
      success: true,
      execution_summary: summary
    });
  } catch (error: any) {
    console.error('Error in /api/simulate:', error);
    return NextResponse.json(
      { error: error?.message || 'Simulation execution failed' },
      { status: 500 }
    );
  }
}
