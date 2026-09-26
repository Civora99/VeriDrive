import { NextRequest, NextResponse } from 'next/server';
import { extractRequirementWithAI } from '@/lib/ai/gemini';
import { evaluateRequirementQuality } from '@/lib/validation/requirementRules';
import { saveRequirement, getRequirementById } from '@/lib/supabase/queries';
import { computeRequirementRisk } from '@/lib/validation/risk';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { raw_text, req_id } = body;

    let requirement;

    if (req_id && !raw_text) {
      requirement = await getRequirementById(req_id);
      if (!requirement) {
        return NextResponse.json({ error: `Requirement ${req_id} not found` }, { status: 404 });
      }
    } else if (raw_text && typeof raw_text === 'string' && raw_text.trim().length > 0) {
      requirement = await extractRequirementWithAI(raw_text);
      // Re-calculate automotive risk score
      const riskAnalysis = computeRequirementRisk(requirement);
      requirement.risk_score = riskAnalysis.overall_risk_score;
      await saveRequirement(requirement);
    } else {
      return NextResponse.json(
        { error: 'Please provide either raw_text or req_id in request body' },
        { status: 400 }
      );
    }

    const qualityAssessment = evaluateRequirementQuality(requirement);

    return NextResponse.json({
      success: true,
      requirement,
      quality: qualityAssessment
    });
  } catch (error: any) {
    console.error('Error in /api/analyze:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to analyze requirement' },
      { status: 500 }
    );
  }
}
