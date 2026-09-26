/**
 * VeriDrive AI - Supabase PostgreSQL Database Types
 * Generated and validated to match supabase/schema.sql
 */

export interface RequirementRow {
  id: string;
  requirement_key: string;
  source_name: string | null;
  raw_text: string;
  component: string | null;
  requirement_type: string | null;
  summary: string | null;
  inputs: Array<{
    name: string;
    type: string;
    interface_bus?: string;
    description?: string;
  }> | null;
  outputs: Array<{
    name: string;
    type: string;
    interface_bus?: string;
    description?: string;
  }> | null;
  conditions: string[] | null;
  constraints: Array<{
    metric?: string;
    value?: string;
    max_latency_ms?: number;
    tolerance?: string;
    tolerance_ms?: number;
    notes?: string;
  }> | null;
  interfaces: string[] | null;
  dependencies: string[] | null;
  risks: Array<{
    risk?: string;
    severity?: string;
    mitigation?: string;
    description?: string;
  }> | null;
  classification_confidence: number | null;
  created_at: string;
}

export type InsertRequirement = Omit<RequirementRow, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type UpdateRequirement = Partial<InsertRequirement>;

export interface AnalysisRunRow {
  id: string;
  requirement_id: string;
  model_name: string;
  analysis_json: Record<string, any>;
  status: string;
  created_at: string;
}

export type InsertAnalysisRun = Omit<AnalysisRunRow, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type UpdateAnalysisRun = Partial<InsertAnalysisRun>;

export interface TestCaseRow {
  id: string;
  requirement_id: string;
  test_key: string;
  title: string;
  category: string;
  objective: string | null;
  preconditions: string | null;
  test_steps: Array<{
    step_num: number;
    action: string;
    can_bus_injection?: string;
    signal_values?: Record<string, any>;
    dwell_time_ms?: number;
  }>;
  inputs: Record<string, any> | null;
  expected_result: string;
  pass_criteria: string;
  priority: string | null;
  risk_level: string | null;
  generated_by: string | null;
  critic_status: string | null;
  created_at: string;
}

export type InsertTestCase = Omit<TestCaseRow, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type UpdateTestCase = Partial<InsertTestCase>;

export interface TestRunRow {
  id: string;
  requirement_id: string;
  run_name: string;
  total_tests: number;
  passed: number;
  failed: number;
  blocked: number;
  simulated: boolean;
  created_at: string;
}

export type InsertTestRun = Omit<TestRunRow, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type UpdateTestRun = Partial<InsertTestRun>;

export interface DefectRow {
  id: string;
  test_case_id: string;
  title: string;
  severity: string;
  description: string;
  expected_behavior: string;
  observed_behavior: string;
  likely_area: string | null;
  created_at: string;
}

export type InsertDefect = Omit<DefectRow, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type UpdateDefect = Partial<InsertDefect>;

export interface TestResultRow {
  id: string;
  test_run_id: string;
  test_case_id: string;
  status: string;
  observed_result: string;
  failure_reason: string | null;
  defect_id: string | null;
  execution_time_ms: number;
  created_at: string;
}

export type InsertTestResult = Omit<TestResultRow, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type UpdateTestResult = Partial<InsertTestResult>;

export interface TraceabilityLinkRow {
  id: string;
  requirement_id: string;
  test_case_id: string;
  coverage_type: string;
  created_at: string;
}

export type InsertTraceabilityLink = Omit<TraceabilityLinkRow, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type UpdateTraceabilityLink = Partial<InsertTraceabilityLink>;

/**
 * Supabase Database interface representation
 */
export interface Database {
  public: {
    Tables: {
      requirements: {
        Row: RequirementRow;
        Insert: InsertRequirement;
        Update: UpdateRequirement;
      };
      analysis_runs: {
        Row: AnalysisRunRow;
        Insert: InsertAnalysisRun;
        Update: UpdateAnalysisRun;
      };
      test_cases: {
        Row: TestCaseRow;
        Insert: InsertTestCase;
        Update: UpdateTestCase;
      };
      test_runs: {
        Row: TestRunRow;
        Insert: InsertTestRun;
        Update: UpdateTestRun;
      };
      defects: {
        Row: DefectRow;
        Insert: InsertDefect;
        Update: UpdateDefect;
      };
      test_results: {
        Row: TestResultRow;
        Insert: InsertTestResult;
        Update: UpdateTestResult;
      };
      traceability_links: {
        Row: TraceabilityLinkRow;
        Insert: InsertTraceabilityLink;
        Update: UpdateTraceabilityLink;
      };
    };
  };
}
