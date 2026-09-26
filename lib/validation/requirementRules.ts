import { StructuredRequirement, RequirementAnalysisResult } from '../types/requirements';

const AMBIGUOUS_WORDS = [
  'quickly',
  'rapidly',
  'normal',
  'appropriate',
  'robust',
  'etc',
  'as soon as possible',
  'good',
  'sufficient',
  'promptly'
];

export function evaluateRequirementQuality(req: StructuredRequirement): RequirementAnalysisResult {
  const violations: string[] = [];
  let clarityScore = 100;
  let testabilityScore = 100;

  // 1. Check for ambiguous words
  const lowerText = req.raw_text.toLowerCase();
  for (const word of AMBIGUOUS_WORDS) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(lowerText)) {
      violations.push(`Ambiguous terminology detected: "${word}". Automotive specifications must use quantitative bounds.`);
      clarityScore -= 8;
      testabilityScore -= 10;
    }
  }

  // 2. Check timing constraints
  const hasTiming = req.timing_constraints.length > 0;
  if (!hasTiming) {
    violations.push('Missing explicit timing constraints. Latency deadlines (e.g. <= 30ms) are required for deterministic validation.');
    testabilityScore -= 20;
  } else {
    // Check if any timing constraint lacks tolerance
    for (const tc of req.timing_constraints) {
      if (tc.tolerance_ms === undefined) {
        violations.push(`Timing constraint "${tc.metric}" specifies max latency (${tc.max_latency_ms}ms) but omits jitter tolerance.`);
        testabilityScore -= 5;
      }
    }
  }

  // 3. Check failure handling
  const hasFailureHandling = req.failure_conditions.length > 0;
  if (!hasFailureHandling) {
    violations.push('No failure handling or fault degradation defined (violates ISO 26262 safe state mandate).');
    clarityScore -= 15;
    testabilityScore -= 15;
  }

  // 4. Check interface definitions
  const hasInterfaces = req.interfaces.length > 0;
  if (!hasInterfaces) {
    violations.push('Network or hardware physical interfaces (CAN, LIN, GPIO) not explicitly defined.');
    testabilityScore -= 15;
  }

  // 5. Check diagnostics
  const hasDiagnostics = req.diagnostic_implications.length > 0;
  if (!hasDiagnostics) {
    violations.push('No UDS ISO 14229 Diagnostic Trouble Code (DTC) or Freeze Frame specification identified.');
    clarityScore -= 10;
  }

  // 6. ASIL specific rigor check
  if (req.asil_level === 'ASIL-D' && (!hasTiming || !hasFailureHandling)) {
    violations.push('CRITICAL ASIL-D VIOLATION: Functional safety goal requires both deterministic timing and fail-silent/fail-operational mechanics.');
    testabilityScore -= 25;
  }

  return {
    requirement: req,
    rule_violations: violations,
    clarity_score: Math.max(30, Math.min(100, clarityScore)),
    testability_score: Math.max(25, Math.min(100, testabilityScore)),
    completeness_assessment: {
      has_timing: hasTiming,
      has_failure_handling: hasFailureHandling,
      has_interfaces: hasInterfaces,
      has_diagnostics: hasDiagnostics
    }
  };
}
