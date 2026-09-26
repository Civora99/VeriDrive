export type AsilLevel = 'QM' | 'ASIL-A' | 'ASIL-B' | 'ASIL-C' | 'ASIL-D';

export type ReqCategory =
  | 'Functional'
  | 'Safety-Critical'
  | 'Diagnostic'
  | 'Timing-Critical'
  | 'Communication'
  | 'Cybersecurity';

export interface ReqInput {
  name: string;
  type: string;
  interface_bus?: string;
  description?: string;
}

export interface ReqOutput {
  name: string;
  type: string;
  interface_bus?: string;
  description?: string;
}

export interface TimingConstraint {
  metric: string;
  max_latency_ms: number;
  tolerance_ms?: number;
  notes?: string;
}

export interface DiagnosticImplication {
  dtc_code?: string;
  service_id?: string;
  description: string;
  freeze_frame_required?: boolean;
}

export interface StructuredRequirement {
  id: string;
  title: string;
  raw_text: string;
  ecu: string;
  asil_level: AsilLevel;
  category: ReqCategory;
  inputs: ReqInput[];
  outputs: ReqOutput[];
  triggers: string[];
  conditions: string[];
  timing_constraints: TimingConstraint[];
  interfaces: string[];
  dependencies: string[];
  failure_conditions: string[];
  safety_related_wording: string[];
  diagnostic_implications: DiagnosticImplication[];
  risk_score: number; // 0 - 100
  confidence_score: number; // 0 - 100
  created_at: string;
  status: 'Draft' | 'Analyzed' | 'Validated' | 'Flagged';
}

export interface RequirementAnalysisResult {
  requirement: StructuredRequirement;
  rule_violations: string[];
  clarity_score: number;
  testability_score: number;
  completeness_assessment: {
    has_timing: boolean;
    has_failure_handling: boolean;
    has_interfaces: boolean;
    has_diagnostics: boolean;
  };
}
