import { StructuredRequirement } from './requirements';
import { TestCase, CriticReview, TestExecutionResult } from './tests';

export interface DatabaseRequirementRow {
  id: string;
  req_key: string; // e.g. REQ-BMS-042
  title: string;
  raw_text: string;
  ecu: string;
  asil_level: string;
  category: string;
  structured_data: StructuredRequirement;
  risk_score: number;
  created_at: string;
}

export interface DatabaseAnalysisRunRow {
  id: string;
  req_id: string;
  model_used: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  clarity_score: number;
  testability_score: number;
  rule_violations: string[];
  created_at: string;
}

export interface DatabaseTestCaseRow {
  id: string;
  req_id: string;
  test_case_key: string; // e.g. TC-BMS-042-01
  title: string;
  category: string;
  asil_target: string;
  test_data: TestCase;
  critic_score: number;
  revised_by_critic: boolean;
  created_at: string;
}

export interface DatabaseTestRunRow {
  id: string;
  req_id: string;
  execution_environment: string; // HIL / SIL / Virtual Bus
  status: string;
  total_tests: number;
  passed_count: number;
  failed_count: number;
  created_at: string;
}

export interface DatabaseTestResultRow {
  id: string;
  run_id: string;
  test_case_id: string;
  status: string;
  measured_latency_ms: number;
  allowed_latency_ms: number;
  execution_log: TestExecutionResult;
  created_at: string;
}

export interface DatabaseDefectRow {
  id: string;
  result_id: string;
  test_case_id: string;
  req_id: string;
  severity: string;
  summary: string;
  root_cause: string;
  can_discrepancy: string;
  recommended_fix: string;
  status: 'Open' | 'Investigating' | 'Resolved';
  created_at: string;
}

export interface DatabaseTraceabilityLinkRow {
  id: string;
  req_id: string;
  test_case_id: string;
  verification_method: 'HIL_Sim' | 'SIL_Sim' | 'CANoe_TestBench' | 'Unit_MCDC';
  status: 'Fully_Covered' | 'Partially_Covered' | 'Uncovered' | 'Failed_Validation';
  created_at: string;
}
