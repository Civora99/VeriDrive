import { StructuredRequirement } from '../types/requirements';
import { TestCase, CriticReview, SuiteExecutionSummary } from '../types/tests';
import { getServerSupabase } from './server';
import { DEMO_REQUIREMENTS } from '../../data/demo-requirements';
import { DEMO_TEST_SUITES, DEMO_CRITIC_REVIEWS, DEMO_SIMULATION_RESULTS } from '../../data/demo-results';

// In-memory store for fallback/dev runtime
const memoryStore: {
  requirements: Map<string, StructuredRequirement>;
  testSuites: Map<string, TestCase[]>;
  criticReviews: Map<string, CriticReview>;
  executionRuns: Map<string, SuiteExecutionSummary>;
} = {
  requirements: new Map(),
  testSuites: new Map(),
  criticReviews: new Map(),
  executionRuns: new Map()
};

// Initialize with demo data
DEMO_REQUIREMENTS.forEach((req) => {
  memoryStore.requirements.set(req.id, req);
});
Object.entries(DEMO_TEST_SUITES).forEach(([reqId, tests]) => {
  memoryStore.testSuites.set(reqId, tests);
});
Object.entries(DEMO_CRITIC_REVIEWS).forEach(([reqId, review]) => {
  memoryStore.criticReviews.set(reqId, review);
});
Object.entries(DEMO_SIMULATION_RESULTS).forEach(([reqId, run]) => {
  memoryStore.executionRuns.set(reqId, run);
});

// Requirements queries
export async function getRequirementsList(): Promise<StructuredRequirement[]> {
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('requirements')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((row) => ({
          ...row.structured_data,
          id: row.req_key,
          raw_text: row.raw_text,
          title: row.title,
          ecu: row.ecu,
          asil_level: row.asil_level,
          risk_score: row.risk_score
        }));
      }
    } catch (e) {
      console.warn('Supabase query failed, falling back to memory store:', e);
    }
  }
  return Array.from(memoryStore.requirements.values());
}

export async function getRequirementById(id: string): Promise<StructuredRequirement | null> {
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('requirements')
        .select('*')
        .eq('req_key', id)
        .single();
      if (!error && data) {
        return {
          ...data.structured_data,
          id: data.req_key,
          raw_text: data.raw_text,
          title: data.title,
          ecu: data.ecu,
          asil_level: data.asil_level,
          risk_score: data.risk_score
        };
      }
    } catch (e) {
      console.warn('Supabase query failed, falling back to memory store:', e);
    }
  }
  return memoryStore.requirements.get(id) || null;
}

export async function saveRequirement(req: StructuredRequirement): Promise<void> {
  memoryStore.requirements.set(req.id, req);
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      await supabase.from('requirements').upsert({
        req_key: req.id,
        title: req.title,
        raw_text: req.raw_text,
        ecu: req.ecu,
        asil_level: req.asil_level,
        category: req.category,
        structured_data: req,
        risk_score: req.risk_score
      });
    } catch (e) {
      console.warn('Failed to persist requirement to Supabase:', e);
    }
  }
}

// Test cases queries
export async function getTestCasesForRequirement(reqId: string): Promise<TestCase[]> {
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('test_cases')
        .select('*')
        .eq('test_data->>req_id', reqId);
      if (!error && data && data.length > 0) {
        return data.map((row) => row.test_data as TestCase);
      }
    } catch (e) {
      console.warn('Supabase query failed for test cases, using memory store:', e);
    }
  }
  return memoryStore.testSuites.get(reqId) || [];
}

export async function saveTestCases(reqId: string, testCases: TestCase[]): Promise<void> {
  memoryStore.testSuites.set(reqId, testCases);
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      for (const tc of testCases) {
        await supabase.from('test_cases').upsert({
          test_case_key: tc.id,
          title: tc.title,
          category: tc.category,
          asil_target: tc.asil_target,
          test_data: tc,
          critic_score: tc.critic_score,
          revised_by_critic: tc.revised_by_critic
        });
      }
    } catch (e) {
      console.warn('Failed to persist test cases to Supabase:', e);
    }
  }
}

// Critic reviews queries
export async function getCriticReview(reqId: string): Promise<CriticReview | null> {
  return memoryStore.criticReviews.get(reqId) || null;
}

export async function saveCriticReview(review: CriticReview): Promise<void> {
  memoryStore.criticReviews.set(review.req_id, review);
}

// Simulation / Execution queries
export async function getExecutionSummary(reqId: string): Promise<SuiteExecutionSummary | null> {
  return memoryStore.executionRuns.get(reqId) || null;
}

export async function saveExecutionSummary(summary: SuiteExecutionSummary): Promise<void> {
  memoryStore.executionRuns.set(summary.req_id, summary);
}
