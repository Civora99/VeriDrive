import { TestCase, TestExecutionResult, SuiteExecutionSummary, CanFrameTrace, TestDefect } from '../types/tests';

export function runSimulationForSuite(
  reqId: string,
  testCases: TestCase[],
  options?: { induceDefect?: boolean }
): SuiteExecutionSummary {
  const shouldInduceDefect = options?.induceDefect !== false; // default true for demo value
  const results: TestExecutionResult[] = [];
  const runId = `RUN-${Date.now().toString(36).toUpperCase()}-${reqId.slice(-4)}`;

  testCases.forEach((tc, idx) => {
    // Determine whether this test should pass or fail for demo realism
    const isFailureCandidate = shouldInduceDefect && (tc.category === 'Power-Cycle' || idx === 6);
    const status: TestExecutionResult['status'] = isFailureCandidate ? 'FAILED' : 'PASSED';

    const allowedLatency =
      tc.expected_results[0]?.max_latency_ms ||
      (tc.category === 'Timing' ? 30 : 100);

    // If failed, measured latency exceeds allowed or an unexpected state occurred
    const measuredLatency = isFailureCandidate
      ? Number((allowedLatency * 1.28).toFixed(1))
      : Number((allowedLatency * (0.35 + (idx % 5) * 0.12)).toFixed(1));

    // Construct realistic CAN Trace
    const canTrace: CanFrameTrace[] = [
      {
        timestamp_ms: 0.0,
        bus: 'CAN1_Powertrain',
        id: '0x102',
        dlc: 8,
        data: '00 96 00 00 00 00 00 00',
        direction: 'Tx',
        signal_decoded: 'Sensory Baseline Broadcast: Active'
      },
      {
        timestamp_ms: 5.0,
        bus: 'CAN2_Chassis',
        id: `0x${(0x200 + idx * 0x10).toString(16).toUpperCase()}`,
        dlc: 8,
        data: tc.steps[0]?.can_bus_injection?.slice(0, 23) || 'AA 55 01 00 00 00 00 00',
        direction: 'Injection',
        signal_decoded: `Stimulus Injection for ${tc.category}`
      },
      {
        timestamp_ms: measuredLatency,
        bus: 'CAN1_Powertrain',
        id: isFailureCandidate ? '0x100' : '0x108',
        dlc: 8,
        data: isFailureCandidate ? '01 00 00 00 00 00 00 00' : '32 02 EE 00 00 00 00 00',
        direction: 'Rx',
        signal_decoded: isFailureCandidate
          ? 'ANOMALOUS_PRECHARGE_ENGAGE'
          : `ECU Response [Conforms <= ${allowedLatency}ms]`
      }
    ];

    // Construct step results
    const stepResults = tc.steps.map((step, sIdx) => {
      const stepPassed = !(isFailureCandidate && sIdx === tc.steps.length - 1);
      return {
        step_num: step.step_num,
        passed: stepPassed,
        log: stepPassed
          ? `[t=${(sIdx * 20).toFixed(1)}ms] Step passed: ${step.action}`
          : `[t=${measuredLatency}ms] STEP FAILED: Hardware assertion violated during ${tc.category}. Measured ${measuredLatency}ms vs limit ${allowedLatency}ms.`,
        timestamp_ms: sIdx * 20
      };
    });

    let defect: TestDefect | undefined = undefined;
    if (isFailureCandidate) {
      defect = {
        id: `DEF-${reqId.slice(-3)}-001`,
        test_case_id: tc.id,
        req_id: reqId,
        ecu: 'ECU Subsystem Target',
        severity: 'Critical (Safety ASIL-D)',
        summary: `Transient Output Assertion Race Condition during ${tc.category}`,
        root_cause: `Microcontroller low-level initialization routine defaults the actuator high-side driver GPIO output to active high prior to validating persistent Non-Volatile Memory (NVM) lockouts in EEPROM.`,
        can_discrepancy: `CAN frame emitted anomalous actuation flag at t=${measuredLatency}ms while system was in shutdown/lockout mode.`,
        actual_vs_expected: `Expected: Discrete driver must stay strictly LOW (0V). Actual: Driver held HIGH for ${measuredLatency}ms before lockout engaged.`,
        recommended_fix: `Hardware pull-down resistor must be reinforced on gate drive circuit, and AUTOSAR MCAL Port driver initialized with default inverted logic in early boot stage.`
      };
    }

    results.push({
      run_id: runId,
      test_case_id: tc.id,
      req_id: reqId,
      test_title: tc.title,
      category: tc.category,
      status,
      execution_time_ms: 120 + idx * 25,
      measured_latency_ms: measuredLatency,
      allowed_latency_ms: allowedLatency,
      step_results: stepResults,
      can_trace: canTrace,
      defect
    });
  });

  const passed = results.filter((r) => r.status === 'PASSED').length;
  const failed = results.filter((r) => r.status === 'FAILED').length;
  const blocked = results.filter((r) => r.status === 'BLOCKED').length;
  const avgLatency = Number(
    (results.reduce((acc, r) => acc + r.measured_latency_ms, 0) / results.length).toFixed(1)
  );
  const maxLatency = Math.max(...results.map((r) => r.measured_latency_ms));

  return {
    run_id: runId,
    req_id: reqId,
    total_tests: results.length,
    passed,
    failed,
    blocked,
    average_latency_ms: avgLatency,
    max_latency_ms: maxLatency,
    execution_date: new Date().toISOString(),
    results
  };
}
