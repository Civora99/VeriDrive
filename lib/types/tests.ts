import { AsilLevel } from './requirements';

export type TestCategory =
  | 'Happy-Path'
  | 'Boundary'
  | 'Negative'
  | 'Timing'
  | 'Communication-Loss'
  | 'Fault-Injection'
  | 'Power-Cycle'
  | 'Recovery'
  | 'Diagnostic'
  | 'Cross-Component';

export interface TestStep {
  step_num: number;
  action: string;
  can_bus_injection?: string;
  signal_values?: Record<string, string | number | boolean>;
  dwell_time_ms?: number;
}

export interface ExpectedResult {
  check_num: number;
  expectation: string;
  can_message_assertion?: string;
  uds_response?: string;
  max_latency_ms?: number;
  signal_assertions?: Record<string, string | number | boolean>;
}

export interface TestCase {
  id: string;
  req_id: string;
  title: string;
  description: string;
  category: TestCategory;
  asil_target: AsilLevel;
  estimated_duration_ms: number;
  preconditions: string[];
  steps: TestStep[];
  expected_results: ExpectedResult[];
  cleanup: string[];
  critic_score: number; // 0 - 100
  critic_feedback?: {
    critique_type: 'Coverage' | 'Ambiguity' | 'Timing' | 'Redundancy' | 'Safety';
    comment: string;
    suggested_revision?: string;
  };
  revised_by_critic: boolean;
  capl_snippet?: string;
  python_hil_snippet?: string;
}

export interface CriticReview {
  req_id: string;
  overall_score: number; // 0 - 100
  rigor_rating: 'Exceptional' | 'Acceptable' | 'Needs Improvement' | 'Critical Gaps';
  missing_coverage_scenarios: string[];
  redundant_test_ids: string[];
  ambiguous_expected_results: string[];
  weak_test_conditions: string[];
  critique_summary: string;
  recommendations: string[];
  original_test_count: number;
  revised_test_count: number;
  added_tests_count: number;
  refined_tests_count: number;
}

export interface CanFrameTrace {
  timestamp_ms: number;
  bus: 'CAN1_Powertrain' | 'CAN2_Chassis' | 'CAN3_Body' | 'LIN1' | 'ETH0';
  id: string;
  dlc: number;
  data: string;
  direction: 'Tx' | 'Rx' | 'Injection';
  signal_decoded?: string;
}

export interface TestDefect {
  id: string;
  test_case_id: string;
  req_id: string;
  ecu: string;
  severity: 'Critical (Safety ASIL-D)' | 'High' | 'Medium' | 'Low';
  summary: string;
  root_cause: string;
  can_discrepancy: string;
  actual_vs_expected: string;
  recommended_fix: string;
}

export interface TestExecutionResult {
  run_id: string;
  test_case_id: string;
  req_id: string;
  test_title: string;
  category: TestCategory;
  status: 'PASSED' | 'FAILED' | 'BLOCKED' | 'RUNNING' | 'INCONCLUSIVE';
  execution_time_ms: number;
  measured_latency_ms: number;
  allowed_latency_ms: number;
  step_results: Array<{
    step_num: number;
    passed: boolean;
    log: string;
    timestamp_ms: number;
  }>;
  can_trace: CanFrameTrace[];
  defect?: TestDefect;
}

export interface SuiteExecutionSummary {
  run_id: string;
  req_id: string;
  total_tests: number;
  passed: number;
  failed: number;
  blocked: number;
  average_latency_ms: number;
  max_latency_ms: number;
  execution_date: string;
  results: TestExecutionResult[];
}
