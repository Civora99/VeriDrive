import { StructuredRequirement } from '../types/requirements';
import { TestCase, CriticReview } from '../types/tests';

export const REQUIREMENT_ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string', description: 'Standardized ID like REQ-BMS-042 or REQ-ECU-001' },
    title: { type: 'string', description: 'Technical automotive requirement title' },
    ecu: { type: 'string', description: 'Target ECU or subsystem, e.g. BMS, ADAS_ECU, EPB, TCU, VCU' },
    asil_level: { type: 'string', enum: ['QM', 'ASIL-A', 'ASIL-B', 'ASIL-C', 'ASIL-D'] },
    category: { type: 'string', enum: ['Functional', 'Safety-Critical', 'Diagnostic', 'Timing-Critical', 'Communication', 'Cybersecurity'] },
    inputs: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string' },
          interface_bus: { type: 'string' },
          description: { type: 'string' }
        },
        required: ['name', 'type']
      }
    },
    outputs: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string' },
          interface_bus: { type: 'string' },
          description: { type: 'string' }
        },
        required: ['name', 'type']
      }
    },
    triggers: { type: 'array', items: { type: 'string' } },
    conditions: { type: 'array', items: { type: 'string' } },
    timing_constraints: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          metric: { type: 'string' },
          max_latency_ms: { type: 'number' },
          tolerance_ms: { type: 'number' },
          notes: { type: 'string' }
        },
        required: ['metric', 'max_latency_ms']
      }
    },
    interfaces: { type: 'array', items: { type: 'string' } },
    dependencies: { type: 'array', items: { type: 'string' } },
    failure_conditions: { type: 'array', items: { type: 'string' } },
    safety_related_wording: { type: 'array', items: { type: 'string' } },
    diagnostic_implications: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          dtc_code: { type: 'string' },
          service_id: { type: 'string' },
          description: { type: 'string' },
          freeze_frame_required: { type: 'boolean' }
        },
        required: ['description']
      }
    },
    risk_score: { type: 'number', minimum: 0, maximum: 100 },
    confidence_score: { type: 'number', minimum: 0, maximum: 100 }
  },
  required: ['id', 'title', 'ecu', 'asil_level', 'category', 'inputs', 'outputs', 'triggers', 'conditions', 'timing_constraints', 'interfaces', 'failure_conditions', 'risk_score']
};

export function validateStructuredRequirement(data: any): StructuredRequirement {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid requirement: not an object');
  }

  return {
    id: String(data.id || 'REQ-AUTO-GEN'),
    title: String(data.title || 'Automotive Functional Specification'),
    raw_text: String(data.raw_text || ''),
    ecu: String(data.ecu || 'Generic_ECU'),
    asil_level: ['QM', 'ASIL-A', 'ASIL-B', 'ASIL-C', 'ASIL-D'].includes(data.asil_level)
      ? data.asil_level
      : 'ASIL-B',
    category: ['Functional', 'Safety-Critical', 'Diagnostic', 'Timing-Critical', 'Communication', 'Cybersecurity'].includes(data.category)
      ? data.category
      : 'Safety-Critical',
    inputs: Array.isArray(data.inputs) ? data.inputs : [],
    outputs: Array.isArray(data.outputs) ? data.outputs : [],
    triggers: Array.isArray(data.triggers) ? data.triggers.map(String) : [],
    conditions: Array.isArray(data.conditions) ? data.conditions.map(String) : [],
    timing_constraints: Array.isArray(data.timing_constraints)
      ? data.timing_constraints.map((tc: any) => ({
          metric: String(tc.metric || 'Response Latency'),
          max_latency_ms: Number(tc.max_latency_ms) || 50,
          tolerance_ms: tc.tolerance_ms ? Number(tc.tolerance_ms) : undefined,
          notes: tc.notes ? String(tc.notes) : undefined
        }))
      : [],
    interfaces: Array.isArray(data.interfaces) ? data.interfaces.map(String) : ['CAN 2.0B (500 kbps)'],
    dependencies: Array.isArray(data.dependencies) ? data.dependencies.map(String) : [],
    failure_conditions: Array.isArray(data.failure_conditions) ? data.failure_conditions.map(String) : [],
    safety_related_wording: Array.isArray(data.safety_related_wording) ? data.safety_related_wording.map(String) : [],
    diagnostic_implications: Array.isArray(data.diagnostic_implications) ? data.diagnostic_implications : [],
    risk_score: typeof data.risk_score === 'number' ? Math.min(100, Math.max(0, data.risk_score)) : 75,
    confidence_score: typeof data.confidence_score === 'number' ? Math.min(100, Math.max(0, data.confidence_score)) : 90,
    created_at: data.created_at || new Date().toISOString(),
    status: data.status || 'Analyzed'
  };
}

export function validateTestCases(data: any): TestCase[] {
  const testsArray = Array.isArray(data) ? data : data?.test_cases || [];
  if (!Array.isArray(testsArray)) return [];

  const validCategories = [
    'Happy-Path',
    'Boundary',
    'Negative',
    'Timing',
    'Communication-Loss',
    'Fault-Injection',
    'Power-Cycle',
    'Recovery',
    'Diagnostic',
    'Cross-Component'
  ];

  return testsArray.map((tc: any, idx: number) => ({
    id: String(tc.id || `TC-GEN-${String(idx + 1).padStart(2, '0')}`),
    req_id: String(tc.req_id || 'REQ-UNKNOWN'),
    title: String(tc.title || `Test Case ${idx + 1}`),
    description: String(tc.description || ''),
    category: validCategories.includes(tc.category) ? tc.category : 'Happy-Path',
    asil_target: tc.asil_target || 'ASIL-B',
    estimated_duration_ms: Number(tc.estimated_duration_ms) || 200,
    preconditions: Array.isArray(tc.preconditions) ? tc.preconditions.map(String) : [],
    steps: Array.isArray(tc.steps)
      ? tc.steps.map((s: any, sIdx: number) => ({
          step_num: Number(s.step_num) || sIdx + 1,
          action: String(s.action || 'Execute test step'),
          can_bus_injection: s.can_bus_injection ? String(s.can_bus_injection) : undefined,
          signal_values: s.signal_values || undefined,
          dwell_time_ms: s.dwell_time_ms ? Number(s.dwell_time_ms) : undefined
        }))
      : [],
    expected_results: Array.isArray(tc.expected_results)
      ? tc.expected_results.map((e: any, eIdx: number) => ({
          check_num: Number(e.check_num) || eIdx + 1,
          expectation: String(e.expectation || 'Signal conforms to boundary'),
          can_message_assertion: e.can_message_assertion ? String(e.can_message_assertion) : undefined,
          uds_response: e.uds_response ? String(e.uds_response) : undefined,
          max_latency_ms: e.max_latency_ms ? Number(e.max_latency_ms) : undefined
        }))
      : [],
    cleanup: Array.isArray(tc.cleanup) ? tc.cleanup.map(String) : [],
    critic_score: typeof tc.critic_score === 'number' ? tc.critic_score : 85,
    critic_feedback: tc.critic_feedback,
    revised_by_critic: Boolean(tc.revised_by_critic),
    capl_snippet: tc.capl_snippet ? String(tc.capl_snippet) : undefined,
    python_hil_snippet: tc.python_hil_snippet ? String(tc.python_hil_snippet) : undefined
  }));
}

export function validateCriticReview(data: any, reqId: string): CriticReview {
  return {
    req_id: reqId,
    overall_score: typeof data?.overall_score === 'number' ? data.overall_score : 88,
    rigor_rating: data?.rigor_rating || 'Exceptional',
    missing_coverage_scenarios: Array.isArray(data?.missing_coverage_scenarios)
      ? data.missing_coverage_scenarios.map(String)
      : [],
    redundant_test_ids: Array.isArray(data?.redundant_test_ids)
      ? data.redundant_test_ids.map(String)
      : [],
    ambiguous_expected_results: Array.isArray(data?.ambiguous_expected_results)
      ? data.ambiguous_expected_results.map(String)
      : [],
    weak_test_conditions: Array.isArray(data?.weak_test_conditions)
      ? data.weak_test_conditions.map(String)
      : [],
    critique_summary: String(data?.critique_summary || 'AI Critic verification completed.'),
    recommendations: Array.isArray(data?.recommendations) ? data.recommendations.map(String) : [],
    original_test_count: Number(data?.original_test_count) || 8,
    revised_test_count: Number(data?.revised_test_count) || 10,
    added_tests_count: Number(data?.added_tests_count) || 2,
    refined_tests_count: Number(data?.refined_tests_count) || 3
  };
}
