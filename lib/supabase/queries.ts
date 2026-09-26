import { getServerSupabase } from './server';
import {
  RequirementRow,
  InsertRequirement,
  UpdateRequirement,
  AnalysisRunRow,
  InsertAnalysisRun,
  TestCaseRow,
  InsertTestCase,
  UpdateTestCase,
  TestRunRow,
  InsertTestRun,
  UpdateTestRun,
  TestResultRow,
  InsertTestResult,
  DefectRow,
  InsertDefect,
  TraceabilityLinkRow,
  InsertTraceabilityLink
} from '../types/database';
import { StructuredRequirement } from '../types/requirements';
import { TestCase, CriticReview, SuiteExecutionSummary } from '../types/tests';
import { DEMO_REQUIREMENTS } from '../../data/demo-requirements';
import { DEMO_TEST_SUITES, DEMO_CRITIC_REVIEWS, DEMO_SIMULATION_RESULTS } from '../../data/demo-results';

// ====================================================================
// In-Memory Fallback Store (Synchronized with Seed Data)
// ====================================================================

const memoryStore = {
  requirements: new Map<string, RequirementRow>(),
  analysisRuns: new Map<string, AnalysisRunRow>(),
  testCases: new Map<string, TestCaseRow>(),
  testRuns: new Map<string, TestRunRow>(),
  testResults: new Map<string, TestResultRow>(),
  defects: new Map<string, DefectRow>(),
  traceabilityLinks: new Map<string, TraceabilityLinkRow>(),
  criticReviews: new Map<string, CriticReview>(),
  executionSummaries: new Map<string, SuiteExecutionSummary>()
};

// Initialize in-memory store with demo and seed requirements
DEMO_REQUIREMENTS.forEach((req, idx) => {
  const reqId = req.id === 'REQ-TLM-001' ? '11111111-1111-1111-1111-111111111111' : `a0000000-0000-0000-0000-${String(idx + 1).padStart(12, '0')}`;
  const row: RequirementRow = {
    id: reqId,
    requirement_key: req.id,
    source_name: req.id === 'REQ-TLM-001' ? 'OEM Connected Vehicle Architecture Specification v3.2' : 'OEM Systems Specification',
    raw_text: req.raw_text,
    component: req.ecu,
    requirement_type: req.category,
    summary: req.title,
    inputs: req.inputs,
    outputs: req.outputs,
    conditions: req.conditions,
    constraints: req.timing_constraints.map((tc) => ({
      metric: tc.metric,
      max_latency_ms: tc.max_latency_ms,
      tolerance_ms: tc.tolerance_ms,
      notes: tc.notes
    })),
    interfaces: req.interfaces,
    dependencies: req.dependencies,
    risks: req.failure_conditions.map((f) => ({ description: f, severity: 'High' })),
    classification_confidence: req.confidence_score ? req.confidence_score / 100 : 0.95,
    created_at: req.created_at || new Date().toISOString()
  };
  memoryStore.requirements.set(req.id, row);
  memoryStore.requirements.set(reqId, row);
});

// Initialize in-memory test cases
Object.entries(DEMO_TEST_SUITES).forEach(([reqKey, tests]) => {
  const reqRow = memoryStore.requirements.get(reqKey);
  const requirementId = reqRow?.id || '11111111-1111-1111-1111-111111111111';

  tests.forEach((tc, idx) => {
    const caseId = reqKey === 'REQ-TLM-001' ? `b0000000-0000-0000-0000-${String(idx + 1).padStart(12, '0')}` : `c0000000-0000-0000-0000-${String(idx + 1).padStart(12, '0')}`;
    const row: TestCaseRow = {
      id: caseId,
      requirement_id: requirementId,
      test_key: tc.id,
      title: tc.title,
      category: tc.category,
      objective: tc.description,
      preconditions: tc.preconditions.join('; '),
      test_steps: tc.steps,
      inputs: tc.steps[0]?.signal_values || {},
      expected_result: tc.expected_results.map((er) => er.expectation).join('; '),
      pass_criteria: tc.expected_results.map((er) => er.can_message_assertion || er.expectation).join('; '),
      priority: tc.asil_target === 'ASIL-D' ? 'Critical' : 'High',
      risk_level: tc.asil_target === 'ASIL-D' ? 'High' : 'Medium',
      generated_by: tc.revised_by_critic ? 'AI-Critic' : 'AI-Generator',
      critic_status: tc.revised_by_critic ? 'REVISED' : 'APPROVED',
      created_at: new Date().toISOString()
    };
    memoryStore.testCases.set(tc.id, row);
    memoryStore.testCases.set(caseId, row);

    // Also link traceability
    const linkId = `d0000000-0000-0000-0000-${String(idx + 1).padStart(12, '0')}`;
    memoryStore.traceabilityLinks.set(linkId, {
      id: linkId,
      requirement_id: requirementId,
      test_case_id: caseId,
      coverage_type: tc.category,
      created_at: new Date().toISOString()
    });
  });
});

// Initialize reviews and simulation results
Object.entries(DEMO_CRITIC_REVIEWS).forEach(([reqKey, rev]) => {
  memoryStore.criticReviews.set(reqKey, rev);
});
Object.entries(DEMO_SIMULATION_RESULTS).forEach(([reqKey, sim]) => {
  memoryStore.executionSummaries.set(reqKey, sim);
});

// ====================================================================
// 1. REQUIREMENTS QUERY HELPERS
// ====================================================================

export async function getRequirements(): Promise<RequirementRow[]> {
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('requirements')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data as RequirementRow[];
      }
    } catch (e) {
      console.warn('Supabase query failed for getRequirements, using fallback:', e);
    }
  }

  // Unique list from memory store
  const unique = Array.from(
    new Map(Array.from(memoryStore.requirements.values()).map((r) => [r.requirement_key, r])).values()
  );
  return unique;
}

export async function getRequirementByKey(key: string): Promise<RequirementRow | null> {
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('requirements')
        .select('*')
        .eq('requirement_key', key)
        .single();
      if (!error && data) {
        return data as RequirementRow;
      }
    } catch (e) {
      console.warn(`Supabase getRequirementByKey(${key}) failed:`, e);
    }
  }

  return memoryStore.requirements.get(key) || null;
}

export async function getRequirementRowById(id: string): Promise<RequirementRow | null> {
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('requirements')
        .select('*')
        .or(`id.eq.${id},requirement_key.eq.${id}`)
        .maybeSingle();
      if (!error && data) {
        return data as RequirementRow;
      }
    } catch (e) {
      console.warn(`Supabase getRequirementRowById(${id}) failed:`, e);
    }
  }

  return memoryStore.requirements.get(id) || null;
}

export function rowToStructuredRequirement(r: RequirementRow): StructuredRequirement {
  const demoMatch = DEMO_REQUIREMENTS.find((d) => d.id === r.requirement_key);
  return {
    id: r.requirement_key,
    title: r.summary || r.requirement_key,
    raw_text: r.raw_text,
    ecu: r.component || 'Generic_ECU',
    asil_level: demoMatch?.asil_level || (r.risks?.some((rk) => rk.severity === 'Critical') ? 'ASIL-D' : 'ASIL-B'),
    category: (r.requirement_type as any) || 'Safety-Critical',
    inputs: r.inputs || [],
    outputs: r.outputs || [],
    triggers: demoMatch?.triggers || ['Periodic timer tick', 'Threshold crossing'],
    conditions: r.conditions || [],
    timing_constraints: r.constraints?.map((c) => ({
      metric: c.metric || 'Latency',
      max_latency_ms: c.max_latency_ms || 10000,
      tolerance_ms: c.tolerance_ms || 500,
      notes: c.notes || c.value
    })) || [],
    interfaces: r.interfaces || [],
    dependencies: r.dependencies || [],
    failure_conditions: r.risks?.map((rk) => rk.description || rk.risk || '') || [],
    safety_related_wording: demoMatch?.safety_related_wording || ['Ensure deterministic telemetry delivery.'],
    diagnostic_implications: demoMatch?.diagnostic_implications || [],
    risk_score: demoMatch?.risk_score || 80,
    confidence_score: r.classification_confidence ? Math.round(Number(r.classification_confidence) * 100) : 95,
    created_at: r.created_at,
    status: 'Validated'
  };
}

export async function getRequirementById(id: string): Promise<StructuredRequirement | null> {
  const row = await getRequirementRowById(id);
  if (!row) {
    return DEMO_REQUIREMENTS.find((d) => d.id === id) || null;
  }
  return rowToStructuredRequirement(row);
}

export async function createRequirement(req: InsertRequirement): Promise<RequirementRow> {
  const id = req.id || crypto.randomUUID();
  const fullRow: RequirementRow = {
    ...req,
    id,
    source_name: req.source_name || null,
    component: req.component || null,
    requirement_type: req.requirement_type || null,
    summary: req.summary || null,
    inputs: req.inputs || [],
    outputs: req.outputs || [],
    conditions: req.conditions || [],
    constraints: req.constraints || [],
    interfaces: req.interfaces || [],
    dependencies: req.dependencies || [],
    risks: req.risks || [],
    classification_confidence: req.classification_confidence ?? 0.9,
    created_at: req.created_at || new Date().toISOString()
  };

  memoryStore.requirements.set(fullRow.requirement_key, fullRow);
  memoryStore.requirements.set(fullRow.id, fullRow);

  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('requirements')
        .upsert(fullRow)
        .select()
        .single();
      if (!error && data) {
        return data as RequirementRow;
      }
    } catch (e) {
      console.warn('Supabase createRequirement failed:', e);
    }
  }

  return fullRow;
}

export async function updateRequirement(
  id: string,
  updates: UpdateRequirement
): Promise<RequirementRow | null> {
  const existing = await getRequirementRowById(id);
  if (!existing) return null;

  const merged: RequirementRow = {
    ...existing,
    ...updates,
    requirement_key: updates.requirement_key ?? existing.requirement_key,
    raw_text: updates.raw_text ?? existing.raw_text
  };
  memoryStore.requirements.set(merged.requirement_key, merged);
  memoryStore.requirements.set(merged.id, merged);

  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('requirements')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .single();
      if (!error && data) return data as RequirementRow;
    } catch (e) {
      console.warn('Supabase updateRequirement failed:', e);
    }
  }

  return merged;
}

// ====================================================================
// 2. ANALYSIS RUNS QUERY HELPERS
// ====================================================================

export async function getAnalysisRuns(requirementId?: string): Promise<AnalysisRunRow[]> {
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      let query = supabase.from('analysis_runs').select('*').order('created_at', { ascending: false });
      if (requirementId) {
        query = query.eq('requirement_id', requirementId);
      }
      const { data, error } = await query;
      if (!error && data) return data as AnalysisRunRow[];
    } catch (e) {
      console.warn('Supabase getAnalysisRuns failed:', e);
    }
  }

  const all = Array.from(memoryStore.analysisRuns.values());
  if (requirementId) return all.filter((r) => r.requirement_id === requirementId);
  return all;
}

export async function createAnalysisRun(run: InsertAnalysisRun): Promise<AnalysisRunRow> {
  const id = run.id || crypto.randomUUID();
  const fullRow: AnalysisRunRow = {
    ...run,
    id,
    created_at: run.created_at || new Date().toISOString()
  };

  memoryStore.analysisRuns.set(id, fullRow);

  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('analysis_runs')
        .insert(fullRow)
        .select()
        .single();
      if (!error && data) return data as AnalysisRunRow;
    } catch (e) {
      console.warn('Supabase createAnalysisRun failed:', e);
    }
  }

  return fullRow;
}

// ====================================================================
// 3. TEST CASES QUERY HELPERS
// ====================================================================

export async function getTestCases(requirementId?: string): Promise<TestCaseRow[]> {
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      let query = supabase.from('test_cases').select('*').order('created_at', { ascending: true });
      if (requirementId) {
        query = query.eq('requirement_id', requirementId);
      }
      const { data, error } = await query;
      if (!error && data) return data as TestCaseRow[];
    } catch (e) {
      console.warn('Supabase getTestCases failed:', e);
    }
  }

  const unique = Array.from(
    new Map(Array.from(memoryStore.testCases.values()).map((tc) => [tc.test_key, tc])).values()
  );
  if (requirementId) return unique.filter((tc) => tc.requirement_id === requirementId);
  return unique;
}

export async function getTestCaseByKey(key: string): Promise<TestCaseRow | null> {
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('test_cases')
        .select('*')
        .eq('test_key', key)
        .single();
      if (!error && data) return data as TestCaseRow;
    } catch (e) {
      console.warn(`Supabase getTestCaseByKey(${key}) failed:`, e);
    }
  }

  return memoryStore.testCases.get(key) || null;
}

export async function createTestCase(testCase: InsertTestCase): Promise<TestCaseRow> {
  const id = testCase.id || crypto.randomUUID();
  const fullRow: TestCaseRow = {
    ...testCase,
    id,
    objective: testCase.objective || null,
    preconditions: testCase.preconditions || null,
    inputs: testCase.inputs || null,
    priority: testCase.priority || 'Medium',
    risk_level: testCase.risk_level || 'Medium',
    generated_by: testCase.generated_by || 'AI-Generator',
    critic_status: testCase.critic_status || 'PENDING',
    created_at: testCase.created_at || new Date().toISOString()
  };

  memoryStore.testCases.set(fullRow.test_key, fullRow);
  memoryStore.testCases.set(fullRow.id, fullRow);

  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('test_cases')
        .upsert(fullRow)
        .select()
        .single();
      if (!error && data) return data as TestCaseRow;
    } catch (e) {
      console.warn('Supabase createTestCase failed:', e);
    }
  }

  return fullRow;
}

export async function createTestCases(testCases: InsertTestCase[]): Promise<TestCaseRow[]> {
  const results: TestCaseRow[] = [];
  for (const tc of testCases) {
    results.push(await createTestCase(tc));
  }
  return results;
}

export async function updateTestCase(id: string, updates: UpdateTestCase): Promise<TestCaseRow | null> {
  const existing = memoryStore.testCases.get(id);
  if (!existing) return null;

  const merged: TestCaseRow = {
    ...existing,
    ...updates,
    requirement_id: updates.requirement_id ?? existing.requirement_id,
    test_key: updates.test_key ?? existing.test_key,
    title: updates.title ?? existing.title,
    category: updates.category ?? existing.category,
    test_steps: updates.test_steps ?? existing.test_steps,
    expected_result: updates.expected_result ?? existing.expected_result,
    pass_criteria: updates.pass_criteria ?? existing.pass_criteria
  };
  memoryStore.testCases.set(merged.test_key, merged);
  memoryStore.testCases.set(merged.id, merged);

  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('test_cases')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .single();
      if (!error && data) return data as TestCaseRow;
    } catch (e) {
      console.warn('Supabase updateTestCase failed:', e);
    }
  }

  return merged;
}

// ====================================================================
// 4. TEST RUNS QUERY HELPERS
// ====================================================================

export async function getTestRuns(requirementId?: string): Promise<TestRunRow[]> {
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      let query = supabase.from('test_runs').select('*').order('created_at', { ascending: false });
      if (requirementId) {
        query = query.eq('requirement_id', requirementId);
      }
      const { data, error } = await query;
      if (!error && data) return data as TestRunRow[];
    } catch (e) {
      console.warn('Supabase getTestRuns failed:', e);
    }
  }

  const all = Array.from(memoryStore.testRuns.values());
  if (requirementId) return all.filter((r) => r.requirement_id === requirementId);
  return all;
}

export async function createTestRun(run: InsertTestRun): Promise<TestRunRow> {
  const id = run.id || crypto.randomUUID();
  const fullRow: TestRunRow = {
    ...run,
    id,
    total_tests: run.total_tests || 0,
    passed: run.passed || 0,
    failed: run.failed || 0,
    blocked: run.blocked || 0,
    simulated: run.simulated ?? true,
    created_at: run.created_at || new Date().toISOString()
  };

  memoryStore.testRuns.set(id, fullRow);

  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('test_runs')
        .insert(fullRow)
        .select()
        .single();
      if (!error && data) return data as TestRunRow;
    } catch (e) {
      console.warn('Supabase createTestRun failed:', e);
    }
  }

  return fullRow;
}

// ====================================================================
// 5. TEST RESULTS QUERY HELPERS
// ====================================================================

export async function getTestResults(testRunId?: string): Promise<TestResultRow[]> {
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      let query = supabase.from('test_results').select('*').order('created_at', { ascending: true });
      if (testRunId) {
        query = query.eq('test_run_id', testRunId);
      }
      const { data, error } = await query;
      if (!error && data) return data as TestResultRow[];
    } catch (e) {
      console.warn('Supabase getTestResults failed:', e);
    }
  }

  const all = Array.from(memoryStore.testResults.values());
  if (testRunId) return all.filter((r) => r.test_run_id === testRunId);
  return all;
}

export async function createTestResult(result: InsertTestResult): Promise<TestResultRow> {
  const id = result.id || crypto.randomUUID();
  const fullRow: TestResultRow = {
    ...result,
    id,
    failure_reason: result.failure_reason || null,
    defect_id: result.defect_id || null,
    execution_time_ms: result.execution_time_ms || 0,
    created_at: result.created_at || new Date().toISOString()
  };

  memoryStore.testResults.set(id, fullRow);

  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('test_results')
        .insert(fullRow)
        .select()
        .single();
      if (!error && data) return data as TestResultRow;
    } catch (e) {
      console.warn('Supabase createTestResult failed:', e);
    }
  }

  return fullRow;
}

export async function createTestResults(results: InsertTestResult[]): Promise<TestResultRow[]> {
  const out: TestResultRow[] = [];
  for (const r of results) {
    out.push(await createTestResult(r));
  }
  return out;
}

// ====================================================================
// 6. DEFECTS QUERY HELPERS
// ====================================================================

export async function getDefects(testCaseId?: string): Promise<DefectRow[]> {
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      let query = supabase.from('defects').select('*').order('created_at', { ascending: false });
      if (testCaseId) {
        query = query.eq('test_case_id', testCaseId);
      }
      const { data, error } = await query;
      if (!error && data) return data as DefectRow[];
    } catch (e) {
      console.warn('Supabase getDefects failed:', e);
    }
  }

  const all = Array.from(memoryStore.defects.values());
  if (testCaseId) return all.filter((d) => d.test_case_id === testCaseId);
  return all;
}

export async function createDefect(defect: InsertDefect): Promise<DefectRow> {
  const id = defect.id || crypto.randomUUID();
  const fullRow: DefectRow = {
    ...defect,
    id,
    likely_area: defect.likely_area || null,
    created_at: defect.created_at || new Date().toISOString()
  };

  memoryStore.defects.set(id, fullRow);

  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('defects')
        .insert(fullRow)
        .select()
        .single();
      if (!error && data) return data as DefectRow;
    } catch (e) {
      console.warn('Supabase createDefect failed:', e);
    }
  }

  return fullRow;
}

// ====================================================================
// 7. TRACEABILITY LINKS QUERY HELPERS
// ====================================================================

export async function getTraceabilityLinks(requirementId?: string): Promise<TraceabilityLinkRow[]> {
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      let query = supabase.from('traceability_links').select('*');
      if (requirementId) {
        query = query.eq('requirement_id', requirementId);
      }
      const { data, error } = await query;
      if (!error && data) return data as TraceabilityLinkRow[];
    } catch (e) {
      console.warn('Supabase getTraceabilityLinks failed:', e);
    }
  }

  const all = Array.from(memoryStore.traceabilityLinks.values());
  if (requirementId) return all.filter((t) => t.requirement_id === requirementId);
  return all;
}

export async function createTraceabilityLink(link: InsertTraceabilityLink): Promise<TraceabilityLinkRow> {
  const id = link.id || crypto.randomUUID();
  const fullRow: TraceabilityLinkRow = {
    ...link,
    id,
    coverage_type: link.coverage_type || 'Functional',
    created_at: link.created_at || new Date().toISOString()
  };

  memoryStore.traceabilityLinks.set(id, fullRow);

  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('traceability_links')
        .upsert(fullRow)
        .select()
        .single();
      if (!error && data) return data as TraceabilityLinkRow;
    } catch (e) {
      console.warn('Supabase createTraceabilityLink failed:', e);
    }
  }

  return fullRow;
}

export async function createTraceabilityLinks(links: InsertTraceabilityLink[]): Promise<TraceabilityLinkRow[]> {
  const out: TraceabilityLinkRow[] = [];
  for (const l of links) {
    out.push(await createTraceabilityLink(l));
  }
  return out;
}

// ====================================================================
// 8. APPLICATION WORKFLOW ADAPTERS (BACKWARDS-COMPATIBLE)
// ====================================================================

export async function getRequirementsList(): Promise<StructuredRequirement[]> {
  const rows = await getRequirements();
  if (rows && rows.length > 0) {
    return rows.map((r) => {
      const demoMatch = DEMO_REQUIREMENTS.find((d) => d.id === r.requirement_key);
      return {
        id: r.requirement_key,
        title: r.summary || r.requirement_key,
        raw_text: r.raw_text,
        ecu: r.component || 'Generic_ECU',
        asil_level: demoMatch?.asil_level || 'ASIL-B',
        category: (r.requirement_type as any) || 'Safety-Critical',
        inputs: r.inputs || [],
        outputs: r.outputs || [],
        triggers: demoMatch?.triggers || ['Periodic timer tick', 'Threshold crossing'],
        conditions: r.conditions || [],
        timing_constraints: r.constraints?.map((c) => ({
          metric: c.metric || 'Latency',
          max_latency_ms: c.max_latency_ms || 10000,
          tolerance_ms: c.tolerance_ms || 500,
          notes: c.notes || c.value
        })) || [],
        interfaces: r.interfaces || [],
        dependencies: r.dependencies || [],
        failure_conditions: r.risks?.map((rk) => rk.description || rk.risk || '') || [],
        safety_related_wording: demoMatch?.safety_related_wording || ['Ensure deterministic telemetry delivery.'],
        diagnostic_implications: demoMatch?.diagnostic_implications || [],
        risk_score: demoMatch?.risk_score || 80,
        confidence_score: r.classification_confidence ? Math.round(Number(r.classification_confidence) * 100) : 95,
        created_at: r.created_at,
        status: 'Validated'
      };
    });
  }

  return DEMO_REQUIREMENTS;
}

export async function saveRequirement(req: StructuredRequirement): Promise<void> {
  await createRequirement({
    requirement_key: req.id,
    source_name: 'VeriDrive AI Ingestion',
    raw_text: req.raw_text,
    component: req.ecu,
    requirement_type: req.category,
    summary: req.title,
    inputs: req.inputs,
    outputs: req.outputs,
    conditions: req.conditions,
    constraints: req.timing_constraints.map((tc) => ({
      metric: tc.metric,
      max_latency_ms: tc.max_latency_ms,
      tolerance_ms: tc.tolerance_ms,
      notes: tc.notes
    })),
    interfaces: req.interfaces,
    dependencies: req.dependencies,
    risks: req.failure_conditions.map((f) => ({ description: f, severity: 'High' })),
    classification_confidence: (req.confidence_score || 95) / 100
  });
}

export async function getTestCasesForRequirement(reqKeyOrId: string): Promise<TestCase[]> {
  // Check demo test suites first for instantaneous rich UI data
  if (DEMO_TEST_SUITES[reqKeyOrId]) {
    return DEMO_TEST_SUITES[reqKeyOrId];
  }

  const reqRow = await getRequirementByKey(reqKeyOrId);
  const rows = await getTestCases(reqRow?.id);
  if (rows && rows.length > 0) {
    return rows.map((r) => ({
      id: r.test_key,
      req_id: reqKeyOrId,
      title: r.title,
      description: r.objective || r.title,
      category: (r.category as any) || 'Happy-Path',
      asil_target: (r.risk_level === 'High' ? 'ASIL-D' : 'ASIL-B') as any,
      estimated_duration_ms: 200,
      preconditions: r.preconditions ? r.preconditions.split('; ') : [],
      steps: r.test_steps || [],
      expected_results: [
        {
          check_num: 1,
          expectation: r.expected_result,
          can_message_assertion: r.pass_criteria,
          max_latency_ms: 50
        }
      ],
      cleanup: ['Quiesce test bench.'],
      critic_score: 94,
      revised_by_critic: r.critic_status === 'REVISED'
    }));
  }

  return DEMO_TEST_SUITES['REQ-TLM-001'] || DEMO_TEST_SUITES['REQ-BMS-042'] || [];
}

export async function saveTestCases(reqId: string, testCases: TestCase[]): Promise<void> {
  const reqRow = await getRequirementByKey(reqId);
  const requirementId = reqRow?.id || crypto.randomUUID();

  for (const tc of testCases) {
    await createTestCase({
      requirement_id: requirementId,
      test_key: tc.id,
      title: tc.title,
      category: tc.category,
      objective: tc.description,
      preconditions: tc.preconditions.join('; '),
      test_steps: tc.steps,
      inputs: tc.steps[0]?.signal_values || {},
      expected_result: tc.expected_results.map((e) => e.expectation).join('; '),
      pass_criteria: tc.expected_results.map((e) => e.can_message_assertion || e.expectation).join('; '),
      priority: tc.asil_target === 'ASIL-D' ? 'Critical' : 'High',
      risk_level: tc.asil_target === 'ASIL-D' ? 'High' : 'Medium',
      generated_by: tc.revised_by_critic ? 'AI-Critic' : 'AI-Generator',
      critic_status: tc.revised_by_critic ? 'REVISED' : 'APPROVED'
    });
  }
}

export async function getCriticReview(reqId: string): Promise<CriticReview | null> {
  return memoryStore.criticReviews.get(reqId) || DEMO_CRITIC_REVIEWS[reqId] || null;
}

export async function saveCriticReview(review: CriticReview): Promise<void> {
  memoryStore.criticReviews.set(review.req_id, review);
}

export async function getExecutionSummary(reqId: string): Promise<SuiteExecutionSummary | null> {
  return memoryStore.executionSummaries.get(reqId) || DEMO_SIMULATION_RESULTS[reqId] || null;
}

export async function saveExecutionSummary(summary: SuiteExecutionSummary): Promise<void> {
  memoryStore.executionSummaries.set(summary.req_id, summary);
}
