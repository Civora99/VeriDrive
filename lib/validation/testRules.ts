import { TestCase } from '../types/tests';

export interface TestAuditReport {
  test_id: string;
  is_valid: boolean;
  issues: string[];
  has_hardware_timing: boolean;
  has_can_bus_injection: boolean;
  has_uds_assertion: boolean;
}

export function auditTestCase(tc: TestCase): TestAuditReport {
  const issues: string[] = [];

  if (tc.steps.length === 0) {
    issues.push('Test case contains zero executable steps.');
  }

  if (tc.expected_results.length === 0) {
    issues.push('Test case contains no verification assertions.');
  }

  const hasHardwareTiming = tc.expected_results.some(
    (er) => typeof er.max_latency_ms === 'number' && er.max_latency_ms > 0
  );

  const hasCanBusInjection = tc.steps.some(
    (s) => Boolean(s.can_bus_injection) || (s.signal_values && Object.keys(s.signal_values).length > 0)
  );

  const hasUdsAssertion = tc.expected_results.some(
    (er) => Boolean(er.uds_response) || (er.can_message_assertion && er.can_message_assertion.includes('0x7E'))
  );

  if (tc.category === 'Timing' && !hasHardwareTiming) {
    issues.push('Timing test case missing numerical max_latency_ms verification assertion.');
  }

  if (tc.category === 'Communication-Loss' && !hasCanBusInjection) {
    issues.push('Communication-loss test lacks CAN bus manipulation injection action.');
  }

  return {
    test_id: tc.id,
    is_valid: issues.length === 0,
    issues,
    has_hardware_timing: hasHardwareTiming,
    has_can_bus_injection: hasCanBusInjection,
    has_uds_assertion: hasUdsAssertion
  };
}
