import { getSupabaseClient } from './supabase/client';
import { TestCase } from './types/tests';
import { StructuredRequirement } from './types/requirements';

export interface BackendSyncOptions {
  autoCreateRequirement?: boolean;
}

/**
 * Persists requirement and AI analysis directly into Supabase 'requirements' and 'analysis_runs' tables.
 */
export async function syncRequirementToSupabase(
  requirementKey: string,
  rawText: string,
  analysis?: Partial<StructuredRequirement>
) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn('[SupabaseBackendBridge] Supabase client not initialized (missing environment variables).');
    return { success: false, reason: 'no_client' };
  }

  try {
    const payload = {
      requirement_key: requirementKey,
      raw_text: rawText,
      component: analysis?.ecu || 'ECU Subsystem',
      requirement_type: analysis?.category || 'Functional',
      summary: rawText.slice(0, 200),
      inputs: analysis?.inputs || [],
      outputs: analysis?.outputs || [],
      conditions: analysis?.conditions || [],
      constraints: analysis?.timing_constraints || [],
      interfaces: analysis?.interfaces || [],
      dependencies: analysis?.dependencies || [],
      risks: analysis?.failure_conditions || [],
    };

    const { data, error } = await supabase
      .from('requirements')
      .upsert(payload, { onConflict: 'requirement_key' })
      .select('id')
      .single();

    if (error) {
      console.error('[SupabaseBackendBridge] Error syncing requirement:', error);
      return { success: false, error };
    }

    return { success: true, requirementId: data.id };
  } catch (err) {
    console.error('[SupabaseBackendBridge] Exception during requirement sync:', err);
    return { success: false, error: err };
  }
}

/**
 * Persists AI generated test cases into Supabase 'test_cases' table.
 */
export async function syncTestCasesToSupabase(
  requirementKey: string,
  testCases: TestCase[]
) {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, reason: 'no_client' };

  try {
    // 1. Resolve requirement UUID
    let { data: req } = await supabase
      .from('requirements')
      .select('id')
      .eq('requirement_key', requirementKey)
      .maybeSingle();

    if (!req) {
      // Auto-create parent requirement
      const created = await syncRequirementToSupabase(requirementKey, `Requirement ${requirementKey}`);
      if (!created.success || !created.requirementId) {
        return { success: false, reason: 'failed_parent_creation' };
      }
      req = { id: created.requirementId };
    }

    // 2. Prepare test case records
    const records = testCases.map((tc) => ({
      requirement_id: req.id,
      test_key: tc.id,
      title: tc.title,
      category: tc.category,
      objective: tc.description,
      preconditions: JSON.stringify(tc.preconditions || []),
      test_steps: tc.steps || [],
      expected_result: tc.expected_results?.[0]?.expectation || 'Pass criteria met',
      priority: tc.asil_target === 'ASIL-D' || tc.asil_target === 'ASIL-C' ? 'HIGH' : 'MEDIUM',
      risk_level: tc.asil_target || 'QM',
      generated_by: 'VeriDrive-AI-Engine',
      critic_feedback: tc.critic_feedback ? JSON.stringify(tc.critic_feedback) : null,
    }));

    const { data, error } = await supabase
      .from('test_cases')
      .upsert(records, { onConflict: 'requirement_id,test_key' })
      .select();

    if (error) {
      console.error('[SupabaseBackendBridge] Error syncing test cases:', error);
      return { success: false, error };
    }

    return { success: true, count: data?.length || 0 };
  } catch (err) {
    console.error('[SupabaseBackendBridge] Exception during test cases sync:', err);
    return { success: false, error: err };
  }
}

/**
 * Tests connection between backend frontend layer and Supabase.
 */
export async function checkSupabaseBackendHealth() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      connected: false,
      message: 'Supabase client credentials not set in NEXT_PUBLIC_SUPABASE_URL / ANON_KEY',
    };
  }

  try {
    const { count, error } = await supabase
      .from('requirements')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return { connected: false, error: error.message };
    }

    return {
      connected: true,
      requirementCount: count || 0,
    };
  } catch (err: any) {
    return { connected: false, error: err?.message || String(err) };
  }
}
