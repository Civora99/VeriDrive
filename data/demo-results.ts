import { TestCase, CriticReview, TestExecutionResult, SuiteExecutionSummary } from '../lib/types/tests';

export const DEMO_TEST_SUITES: Record<string, TestCase[]> = {
  'REQ-BMS-042': [
    {
      id: 'TC-BMS-042-01',
      req_id: 'REQ-BMS-042',
      title: 'Nominal Thermal Ramp and 50% Derating Execution',
      description: 'Verify BMS current derate command is broadcast on CAN 0x108 within 100ms when any cell reaches 60.5°C for > 50ms.',
      category: 'Happy-Path',
      asil_target: 'ASIL-D',
      estimated_duration_ms: 250,
      preconditions: [
        'Pack is energized, Contactors closed (12V High-Side supply nominal)',
        'Vehicle state is DRIVE with active 150A discharge current',
        'Initial pack cell temperatures between 28°C and 32°C'
      ],
      steps: [
        {
          step_num: 1,
          action: 'Inject simulated temperature rise on Cell 42 from 30.0°C to 61.2°C at t=0ms.',
          can_bus_injection: 'HIL_SPI_TempSensor_Inject(Cell_42, 61.2)',
          signal_values: { cell_42_temp: 61.2, duration_hold_ms: 70 },
          dwell_time_ms: 70
        },
        {
          step_num: 2,
          action: 'Monitor CAN1_Powertrain for frame BMS_Derate_Status (0x108).',
          signal_values: { expected_derate_pct: 50 },
          dwell_time_ms: 50
        }
      ],
      expected_results: [
        {
          check_num: 1,
          expectation: 'CAN ID 0x108 transmitted within 100ms with Derate_Request_Flag = 1 and Max_Permissible_Current = 75A.',
          can_message_assertion: 'CAN1.0x108: Byte[0] == 0x32 (50%), Byte[1..2] == 0x02EE (75A)',
          max_latency_ms: 100
        }
      ],
      cleanup: ['Reset simulated cell 42 temperature back to 28.0°C.'],
      critic_score: 94,
      revised_by_critic: false,
      capl_snippet: `on message CAN1::0x108 {
  testStep("Derate Assertion", "Verify 50% derate byte received");
  if (this.byte(0) == 0x32 && timeDiff < 100) {
    testStepPass("BMS derated correctly within 100ms");
  }
}`
    },
    {
      id: 'TC-BMS-042-02',
      req_id: 'REQ-BMS-042',
      title: 'Boundary Temperature Stability at 59.9°C (Sub-Threshold Inhibit)',
      description: 'Confirm no derate or contactor trip occurs when cell temperature hovers right below the boundary at 59.9°C for extended duration.',
      category: 'Boundary',
      asil_target: 'ASIL-D',
      estimated_duration_ms: 300,
      preconditions: [
        'Pack is energized, nominal current draw 100A',
        'Cell temperatures stabilized at 45.0°C'
      ],
      steps: [
        {
          step_num: 1,
          action: 'Ramp Cell 12 temperature to precisely 59.9°C and hold for 200ms.',
          signal_values: { cell_12_temp: 59.9, hold_time_ms: 200 },
          dwell_time_ms: 200
        }
      ],
      expected_results: [
        {
          check_num: 1,
          expectation: 'No derate broadcast (0x108 Byte[0] remains 0x64/100%) and Contactors remain CLOSED.',
          can_message_assertion: 'CAN1.0x108: Byte[0] == 0x64 (No Derate)',
          max_latency_ms: 200
        }
      ],
      cleanup: ['Return Cell 12 temperature to 35.0°C.'],
      critic_score: 92,
      revised_by_critic: false
    },
    {
      id: 'TC-BMS-042-03',
      req_id: 'REQ-BMS-042',
      title: 'Transient Thermal Spike (40ms Noise Rejection)',
      description: 'Verify noise spikes exceeding 68°C that last less than the 50ms qualification window do NOT cause false emergency contactor trip.',
      category: 'Negative',
      asil_target: 'ASIL-D',
      estimated_duration_ms: 200,
      preconditions: ['Contactors closed, vehicle cruising normally.'],
      steps: [
        {
          step_num: 1,
          action: 'Inject simulated ADC voltage glitch simulating 72.0°C for 40ms, then drop to 52.0°C.',
          signal_values: { spike_temp: 72.0, duration_ms: 40 },
          dwell_time_ms: 100
        }
      ],
      expected_results: [
        {
          check_num: 1,
          expectation: 'Contactors remain CLOSED; BMS filters EMI glitch without emergency shutdown.',
          can_message_assertion: 'HVIL_Contactor_Discrete == 1 (CLOSED)'
        }
      ],
      cleanup: ['Verify normal telemetry stream.'],
      critic_score: 89,
      revised_by_critic: false
    },
    {
      id: 'TC-BMS-042-04',
      req_id: 'REQ-BMS-042',
      title: 'Emergency Contactor Open Hardware Timing (< 30ms Latency)',
      description: 'Measure precision hardware latency between Cell Temp >= 68.0°C transition and contactor auxiliary contact opening.',
      category: 'Timing',
      asil_target: 'ASIL-D',
      estimated_duration_ms: 150,
      preconditions: ['Pack energized at 400V DC, 80A load, oscilloscope trigger armed on HVIL and GPIO.'],
      steps: [
        {
          step_num: 1,
          action: 'Step change Cell 88 temp to 69.5°C instantaneously via precision HIL resistor board.',
          signal_values: { step_temp: 69.5 },
          dwell_time_ms: 60
        }
      ],
      expected_results: [
        {
          check_num: 1,
          expectation: 'Main positive contactor driver GPIO de-asserts in <= 30ms (target: < 25ms).',
          max_latency_ms: 30
        },
        {
          check_num: 2,
          expectation: 'Emergency broadcast CAN frame 0x050 transmits within 10ms with payload 0xEE.',
          can_message_assertion: 'CAN1.0x050: Byte[0] == 0xEE',
          max_latency_ms: 10
        }
      ],
      cleanup: ['De-energize bench power supply.'],
      critic_score: 97,
      revised_by_critic: true,
      critic_feedback: {
        critique_type: 'Timing',
        comment: 'Critic strengthened requirement to assert both hardware GPIO de-energization AND CAN 0x050 latency simultaneously.',
        suggested_revision: 'Added dual check on GPIO pulse and 0x050 frame time.'
      }
    },
    {
      id: 'TC-BMS-042-05',
      req_id: 'REQ-BMS-042',
      title: 'CAN1 Powertrain Bus-Off Fault During Thermal Emergency',
      description: 'Inject dominant bit clamp on CAN1 to force Bus-Off. Verify hardware backup discrete line trips contactor safely.',
      category: 'Communication-Loss',
      asil_target: 'ASIL-D',
      estimated_duration_ms: 200,
      preconditions: ['Pack energized, CAN1 active at 500 kbps.'],
      steps: [
        {
          step_num: 1,
          action: 'Short CAN1_High to CAN1_Low to induce immediate CAN Controller Bus-Off.',
          can_bus_injection: 'PHYSICAL_SHORT(CAN1_H, CAN1_L)',
          dwell_time_ms: 20
        },
        {
          step_num: 2,
          action: 'Inject 70.0°C thermal event while CAN bus is dead.',
          signal_values: { cell_1_temp: 70.0 },
          dwell_time_ms: 50
        }
      ],
      expected_results: [
        {
          check_num: 1,
          expectation: 'Hardwired discrete HVIL_TRIP_DISCRETE drops to 0V within 30ms regardless of CAN bus state.',
          max_latency_ms: 30
        }
      ],
      cleanup: ['Remove CAN bus short circuit, recover transceivers.'],
      critic_score: 96,
      revised_by_critic: true
    },
    {
      id: 'TC-BMS-042-06',
      req_id: 'REQ-BMS-042',
      title: 'Thermistor Sensor Open-Circuit Fault Injection',
      description: 'Simulate broken harness wire to module 3 thermistor array (reads -50°C open-circuit) under thermal stress.',
      category: 'Fault-Injection',
      asil_target: 'ASIL-D',
      estimated_duration_ms: 250,
      preconditions: ['Nominal operating temperature 35°C.'],
      steps: [
        {
          step_num: 1,
          action: 'Disconnect thermistor harness on Channel B via relay matrix.',
          can_bus_injection: 'HIL_RELAY_OPEN(Thermistor_ChB)',
          dwell_time_ms: 100
        }
      ],
      expected_results: [
        {
          check_num: 1,
          expectation: 'BMS flags Sensor Disconnect, defaults adjacent modules to worst-case estimation, logs DTC P0AA6.',
          can_message_assertion: 'CAN1.0x108: Byte[4] & 0x01 == 1 (Sensor Fault Flag)'
        }
      ],
      cleanup: ['Re-engage relay matrix connection.'],
      critic_score: 91,
      revised_by_critic: false
    },
    {
      id: 'TC-BMS-042-07',
      req_id: 'REQ-BMS-042',
      title: 'KL15 Power Cycle Reboot and Contactor Lockout Persistence',
      description: 'Confirm that thermal trip state persists in Non-Volatile Memory (NVM) across an ignition 12V brownout / reboot.',
      category: 'Power-Cycle',
      asil_target: 'ASIL-D',
      estimated_duration_ms: 400,
      preconditions: ['BMS in Thermal Hazard Tripped State with DTC P0A80 stored.'],
      steps: [
        {
          step_num: 1,
          action: 'Switch KL15 Ignition to OFF for 2.0 seconds, then toggle KL30 Battery power to 0V (complete reset).',
          dwell_time_ms: 200
        },
        {
          step_num: 2,
          action: 'Re-apply 12V KL30 and switch KL15 ON.',
          dwell_time_ms: 150
        }
      ],
      expected_results: [
        {
          check_num: 1,
          expectation: 'BMS boots up in LOCKOUT state; Contactors remain OPEN even if cell temperature has cooled to 25°C.',
          can_message_assertion: 'HVIL_Contactor_Discrete == 0 (LOCKED OPEN)'
        }
      ],
      cleanup: ['Execute UDS diagnostic session unlock.'],
      critic_score: 95,
      revised_by_critic: true
    },
    {
      id: 'TC-BMS-042-08',
      req_id: 'REQ-BMS-042',
      title: 'UDS Service 0x14 Clear Diagnostic Information Authorized Recovery',
      description: 'Verify contactors are only allowed to re-close after authorized diagnostic DTC clear and temperature confirmation.',
      category: 'Recovery',
      asil_target: 'ASIL-D',
      estimated_duration_ms: 350,
      preconditions: [
        'BMS locked out following thermal event',
        'All cells confirmed below 45°C'
      ],
      steps: [
        {
          step_num: 1,
          action: 'Send UDS 0x10 0x03 (Extended Diagnostic Session Request) on CAN ID 0x7E0.',
          can_bus_injection: 'CAN1.0x7E0: 02 10 03 00 00 00 00 00',
          dwell_time_ms: 50
        },
        {
          step_num: 2,
          action: 'Send UDS 0x14 FF FF FF (Clear All Diagnostic Information).',
          can_bus_injection: 'CAN1.0x7E0: 04 14 FF FF FF 00 00 00',
          dwell_time_ms: 80
        }
      ],
      expected_results: [
        {
          check_num: 1,
          expectation: 'BMS responds with positive response 0x54, clears DTC P0A80, and enables contactor pre-charge sequence.',
          uds_response: 'CAN1.0x7E8: 01 54 00 00 00 00 00 00'
        }
      ],
      cleanup: ['Return to default diagnostic session 0x10 0x01.'],
      critic_score: 93,
      revised_by_critic: false
    },
    {
      id: 'TC-BMS-042-09',
      req_id: 'REQ-BMS-042',
      title: 'UDS Service 0x19 0x04 Freeze Frame Memory Retrieval',
      description: 'Verify freeze frame captures exact max cell temp, cell index, pack voltage, and current at the moment of contactor open.',
      category: 'Diagnostic',
      asil_target: 'ASIL-D',
      estimated_duration_ms: 300,
      preconditions: ['DTC P0A80 logged in EEPROM after thermal test.'],
      steps: [
        {
          step_num: 1,
          action: 'Query UDS Service 0x19 Subfunction 0x04 for DTC P0A80 Record 0x01.',
          can_bus_injection: 'CAN1.0x7E0: 05 19 04 0A 80 00 01 00',
          dwell_time_ms: 60
        }
      ],
      expected_results: [
        {
          check_num: 1,
          expectation: 'Positive response 0x59 received with Freeze Frame containing Cell Temp DID 0xF1A0 = 69.5°C.',
          uds_response: 'CAN1.0x7E8: 59 04 0A 80 00 28 F1 A0 45'
        }
      ],
      cleanup: ['None.'],
      critic_score: 90,
      revised_by_critic: false
    },
    {
      id: 'TC-BMS-042-10',
      req_id: 'REQ-BMS-042',
      title: 'Inverter Fast Discharge Cross-Component Synchronization',
      description: 'Verify Inverter MCU activates active DC-link capacitor discharge within 50ms of receiving BMS_Emergency_Shutdown (0x050).',
      category: 'Cross-Component',
      asil_target: 'ASIL-D',
      estimated_duration_ms: 250,
      preconditions: ['DC link capacitor charged to 400V, Inverter MCU listening on CAN1.'],
      steps: [
        {
          step_num: 1,
          action: 'Transmit BMS_Emergency_Shutdown frame 0x050.',
          can_bus_injection: 'CAN1.0x050: EE 01 00 00 00 00 00 00',
          dwell_time_ms: 60
        }
      ],
      expected_results: [
        {
          check_num: 1,
          expectation: 'Inverter bus voltage drops from 400V to < 60V (safe touch voltage) in <= 100ms.',
          can_message_assertion: 'CAN1.0x128 (MCU_Status): DC_Link_Voltage < 60.0V',
          max_latency_ms: 100
        }
      ],
      cleanup: ['Discharge verification complete.'],
      critic_score: 95,
      revised_by_critic: true
    }
  ]
};

export const DEMO_CRITIC_REVIEWS: Record<string, CriticReview> = {
  'REQ-BMS-042': {
    req_id: 'REQ-BMS-042',
    overall_score: 94,
    rigor_rating: 'Exceptional',
    missing_coverage_scenarios: [
      'Original suite lacked dual-signal synchronization between hardware GPIO trip and CAN 0x050 emergency broadcast.',
      'Did not initially test thermal emergency handling under a simultaneous physical CAN bus-off condition.'
    ],
    redundant_test_ids: [
      'TC-BMS-042-03B (Duplicate boundary check at 60.1°C merged into TC-BMS-042-01)'
    ],
    ambiguous_expected_results: [
      'Initial expected result for TC-BMS-042-04 merely stated "Contactors open quickly" - updated to strict ISO 26262 requirement: "<= 30ms hardware de-energization".'
    ],
    weak_test_conditions: [
      'TC-BMS-042-07 was tested only with 12V KL15 key switch, not a full KL30 battery disconnect brownout. Upgraded to full power rail brownout.'
    ],
    critique_summary: 'Comprehensive ISO 26262 ASIL-D test suite generated. Critic detected 2 critical fault injection edge cases (CAN bus-off during thermal runaway and power-loss lockout persistence) and reinforced timing tolerances down to millisecond precision.',
    recommendations: [
      'Ensure HIL test bench supports microsecond-resolution hardware timestamping on the HVIL driver pin.',
      'Automate UDS 0x14 reset script in continuous regression test pipeline.'
    ],
    original_test_count: 8,
    revised_test_count: 10,
    added_tests_count: 2,
    refined_tests_count: 4
  },
  'REQ-ACC-104': {
    req_id: 'REQ-ACC-104',
    overall_score: 91,
    rigor_rating: 'Exceptional',
    missing_coverage_scenarios: [
      'Missing scenario where radar sends stale data with frozen rolling counter rather than simply going silent.',
      'Missing scenario where driver taps accelerator during the -1.5 m/s² deceleration fallback.'
    ],
    redundant_test_ids: [],
    ambiguous_expected_results: [
      'Deceleration profile was specified without tolerance limits. Added strict boundary: -1.5 m/s² ± 0.2 m/s² over 1.2s.'
    ],
    weak_test_conditions: [
      'CRC error injection was only single-frame. Strengthened to 3 consecutive corrupt frames to match AUTOSAR E2E Profile 1 requirements.'
    ],
    critique_summary: 'Targeted ASIL-B ADAS validation suite. Critic refined the timing requirements for radar loss fallback and added E2E CRC corruption tests.',
    recommendations: [
      'Validate acoustic chime frequency (850 Hz) using CANoe audio analyzer.',
      'Verify transition smoothness on vehicle dynamic test rig.'
    ],
    original_test_count: 7,
    revised_test_count: 9,
    added_tests_count: 2,
    refined_tests_count: 3
  }
};

export const DEMO_SIMULATION_RESULTS: Record<string, SuiteExecutionSummary> = {
  'REQ-BMS-042': {
    run_id: 'RUN-2026-BMS-HIL-01',
    req_id: 'REQ-BMS-042',
    total_tests: 10,
    passed: 9,
    failed: 1,
    blocked: 0,
    average_latency_ms: 18.4,
    max_latency_ms: 38.6,
    execution_date: new Date('2026-03-24T14:15:00Z').toISOString(),
    results: [
      {
        run_id: 'RUN-2026-BMS-HIL-01',
        test_case_id: 'TC-BMS-042-01',
        req_id: 'REQ-BMS-042',
        test_title: 'Nominal Thermal Ramp and 50% Derating Execution',
        category: 'Happy-Path',
        status: 'PASSED',
        execution_time_ms: 185,
        measured_latency_ms: 22.4,
        allowed_latency_ms: 100.0,
        step_results: [
          { step_num: 1, passed: true, log: 'Injected 61.2°C to Cell 42 via SPI emulation.', timestamp_ms: 0 },
          { step_num: 2, passed: true, log: 'CAN frame 0x108 received at t=22.4ms with derate limit = 50% (75A).', timestamp_ms: 22.4 }
        ],
        can_trace: [
          { timestamp_ms: 0.0, bus: 'CAN1_Powertrain', id: '0x102', dlc: 8, data: '00 96 00 00 00 00 00 00', direction: 'Tx', signal_decoded: 'Pack_Current=150.0A' },
          { timestamp_ms: 5.0, bus: 'CAN2_Chassis', id: '0x320', dlc: 8, data: '3D 00 00 00 00 00 00 00', direction: 'Injection', signal_decoded: 'Cell_42_Temp=61.2°C' },
          { timestamp_ms: 22.4, bus: 'CAN1_Powertrain', id: '0x108', dlc: 8, data: '32 02 EE 00 00 00 00 00', direction: 'Rx', signal_decoded: 'BMS_Derate: 50%, Limit=75A' }
        ]
      },
      {
        run_id: 'RUN-2026-BMS-HIL-01',
        test_case_id: 'TC-BMS-042-02',
        req_id: 'REQ-BMS-042',
        test_title: 'Boundary Temperature Stability at 59.9°C (Sub-Threshold Inhibit)',
        category: 'Boundary',
        status: 'PASSED',
        execution_time_ms: 210,
        measured_latency_ms: 0.0,
        allowed_latency_ms: 200.0,
        step_results: [
          { step_num: 1, passed: true, log: 'Held cell at 59.9°C for 200ms. No derate flag triggered.', timestamp_ms: 200 }
        ],
        can_trace: [
          { timestamp_ms: 10.0, bus: 'CAN1_Powertrain', id: '0x108', dlc: 8, data: '64 05 DC 00 00 00 00 00', direction: 'Rx', signal_decoded: 'BMS_Derate: 100% (No derate)' }
        ]
      },
      {
        run_id: 'RUN-2026-BMS-HIL-01',
        test_case_id: 'TC-BMS-042-03',
        req_id: 'REQ-BMS-042',
        test_title: 'Transient Thermal Spike (40ms Noise Rejection)',
        category: 'Negative',
        status: 'PASSED',
        execution_time_ms: 140,
        measured_latency_ms: 40.0,
        allowed_latency_ms: 50.0,
        step_results: [
          { step_num: 1, passed: true, log: 'Spike to 72°C rejected by 50ms low-pass debounce filter. Contactors closed.', timestamp_ms: 40 }
        ],
        can_trace: [
          { timestamp_ms: 5.0, bus: 'CAN2_Chassis', id: '0x320', dlc: 8, data: '48 00 00 00 00 00 00 00', direction: 'Injection', signal_decoded: 'Glitch_Temp=72.0°C' },
          { timestamp_ms: 45.0, bus: 'CAN2_Chassis', id: '0x320', dlc: 8, data: '34 00 00 00 00 00 00 00', direction: 'Injection', signal_decoded: 'Restored_Temp=52.0°C' }
        ]
      },
      {
        run_id: 'RUN-2026-BMS-HIL-01',
        test_case_id: 'TC-BMS-042-04',
        req_id: 'REQ-BMS-042',
        test_title: 'Emergency Contactor Open Hardware Timing (< 30ms Latency)',
        category: 'Timing',
        status: 'PASSED',
        execution_time_ms: 95,
        measured_latency_ms: 24.1,
        allowed_latency_ms: 30.0,
        step_results: [
          { step_num: 1, passed: true, log: 'Step change to 69.5°C injected.', timestamp_ms: 0 },
          { step_num: 2, passed: true, log: 'Hardware GPIO driver pulled low at t=24.1ms. Within 30ms ASIL-D window.', timestamp_ms: 24.1 },
          { step_num: 3, passed: true, log: 'Emergency CAN broadcast 0x050 sent at t=6.2ms.', timestamp_ms: 6.2 }
        ],
        can_trace: [
          { timestamp_ms: 0.0, bus: 'CAN2_Chassis', id: '0x320', dlc: 8, data: '45 00 00 00 00 00 00 00', direction: 'Injection', signal_decoded: 'Hazard_Temp=69.5°C' },
          { timestamp_ms: 6.2, bus: 'CAN1_Powertrain', id: '0x050', dlc: 8, data: 'EE 00 00 00 00 00 00 00', direction: 'Rx', signal_decoded: 'BMS_Emergency_Shutdown' }
        ]
      },
      {
        run_id: 'RUN-2026-BMS-HIL-01',
        test_case_id: 'TC-BMS-042-05',
        req_id: 'REQ-BMS-042',
        test_title: 'CAN1 Powertrain Bus-Off Fault During Thermal Emergency',
        category: 'Communication-Loss',
        status: 'PASSED',
        execution_time_ms: 160,
        measured_latency_ms: 19.8,
        allowed_latency_ms: 30.0,
        step_results: [
          { step_num: 1, passed: true, log: 'Bus-off condition provoked.', timestamp_ms: 10 },
          { step_num: 2, passed: true, log: 'Hardwired discrete line de-energized contactor in 19.8ms without CAN dependancy.', timestamp_ms: 29.8 }
        ],
        can_trace: [
          { timestamp_ms: 10.0, bus: 'CAN1_Powertrain', id: '0x7FF', dlc: 0, data: 'BUS_OFF_ERROR_FRAME', direction: 'Injection', signal_decoded: 'Bus-Off Error State' }
        ]
      },
      {
        run_id: 'RUN-2026-BMS-HIL-01',
        test_case_id: 'TC-BMS-042-06',
        req_id: 'REQ-BMS-042',
        test_title: 'Thermistor Sensor Open-Circuit Fault Injection',
        category: 'Fault-Injection',
        status: 'PASSED',
        execution_time_ms: 180,
        measured_latency_ms: 15.2,
        allowed_latency_ms: 50.0,
        step_results: [
          { step_num: 1, passed: true, log: 'Relay opened sensor circuit.', timestamp_ms: 0 },
          { step_num: 2, passed: true, log: 'BMS detected open circuit (-50°C), set DTC P0AA6.', timestamp_ms: 15.2 }
        ],
        can_trace: [
          { timestamp_ms: 15.2, bus: 'CAN1_Powertrain', id: '0x108', dlc: 8, data: '32 02 EE 00 01 00 00 00', direction: 'Rx', signal_decoded: 'Sensor_Fault_Flag=1' }
        ]
      },
      {
        run_id: 'RUN-2026-BMS-HIL-01',
        test_case_id: 'TC-BMS-042-07',
        req_id: 'REQ-BMS-042',
        test_title: 'KL15 Power Cycle Reboot and Contactor Lockout Persistence',
        category: 'Power-Cycle',
        status: 'FAILED',
        execution_time_ms: 380,
        measured_latency_ms: 38.6,
        allowed_latency_ms: 30.0,
        step_results: [
          { step_num: 1, passed: true, log: 'Power supply cycled (KL30 0V -> 12V reboot).', timestamp_ms: 200 },
          { step_num: 2, passed: false, log: 'DEFECT DETECTED: BMS bootloader initiated pre-charge relay for 38.6ms before reading NVM lockout flag!', timestamp_ms: 238.6 }
        ],
        can_trace: [
          { timestamp_ms: 200.0, bus: 'CAN1_Powertrain', id: '0x000', dlc: 0, data: 'ECU_RESET_EVENT', direction: 'Injection', signal_decoded: 'KL30 12V Power Restored' },
          { timestamp_ms: 238.6, bus: 'CAN1_Powertrain', id: '0x100', dlc: 8, data: '01 00 00 00 00 00 00 00', direction: 'Rx', signal_decoded: 'UNINTENDED_PRECHARGE_ENGAGE' }
        ],
        defect: {
          id: 'DEF-BMS-001',
          test_case_id: 'TC-BMS-042-07',
          req_id: 'REQ-BMS-042',
          ecu: 'BMS (Battery Management System)',
          severity: 'Critical (Safety ASIL-D)',
          summary: 'Transient Pre-charge Contactor Closure during Post-Thermal Reboot',
          root_cause: 'In bootloader startup routine `bms_startup.c`, GPIO initialization defaults the pre-charge FET output to active HIGH before reading the persistent NVM thermal lockout byte from EEPROM.',
          can_discrepancy: 'CAN ID 0x100 emitted Precharge_Status=Active at t=238.6ms while DTC P0A80 thermal lockout was supposed to enforce 100% inhibit.',
          actual_vs_expected: 'Expected: Contactors remain strictly OPEN (0V) throughout boot sequence. Actual: Pre-charge contactor energized for 38.6ms.',
          recommended_fix: 'Configure hardware pull-down resistors on pre-charge GPIO pins and invert microcontroller low-level init in `hw_init_pins()` to guarantee default tri-state / LOW before EEPROM read.'
        }
      },
      {
        run_id: 'RUN-2026-BMS-HIL-01',
        test_case_id: 'TC-BMS-042-08',
        req_id: 'REQ-BMS-042',
        test_title: 'UDS Service 0x14 Clear Diagnostic Information Authorized Recovery',
        category: 'Recovery',
        status: 'PASSED',
        execution_time_ms: 290,
        measured_latency_ms: 12.0,
        allowed_latency_ms: 50.0,
        step_results: [
          { step_num: 1, passed: true, log: 'UDS 0x10 0x03 accepted (Extended Session).', timestamp_ms: 50 },
          { step_num: 2, passed: true, log: 'UDS 0x14 executed, positive response 0x54 received.', timestamp_ms: 90 }
        ],
        can_trace: [
          { timestamp_ms: 50.0, bus: 'CAN1_Powertrain', id: '0x7E0', dlc: 8, data: '02 10 03 00 00 00 00 00', direction: 'Tx', signal_decoded: 'DiagSessionControl 0x03' },
          { timestamp_ms: 58.0, bus: 'CAN1_Powertrain', id: '0x7E8', dlc: 8, data: '02 50 03 00 00 00 00 00', direction: 'Rx', signal_decoded: 'PositiveResponse 0x50 03' },
          { timestamp_ms: 90.0, bus: 'CAN1_Powertrain', id: '0x7E0', dlc: 8, data: '04 14 FF FF FF 00 00 00', direction: 'Tx', signal_decoded: 'ClearDiagnosticInfo' },
          { timestamp_ms: 102.0, bus: 'CAN1_Powertrain', id: '0x7E8', dlc: 8, data: '01 54 00 00 00 00 00 00', direction: 'Rx', signal_decoded: 'PositiveResponse 0x54' }
        ]
      },
      {
        run_id: 'RUN-2026-BMS-HIL-01',
        test_case_id: 'TC-BMS-042-09',
        req_id: 'REQ-BMS-042',
        test_title: 'UDS Service 0x19 0x04 Freeze Frame Memory Retrieval',
        category: 'Diagnostic',
        status: 'PASSED',
        execution_time_ms: 220,
        measured_latency_ms: 14.5,
        allowed_latency_ms: 60.0,
        step_results: [
          { step_num: 1, passed: true, log: 'Freeze frame 0x01 query sent for DTC P0A80.', timestamp_ms: 60 },
          { step_num: 2, passed: true, log: 'Received valid freeze frame: Cell Temp=69.5°C, Pack Current=148A.', timestamp_ms: 74.5 }
        ],
        can_trace: [
          { timestamp_ms: 60.0, bus: 'CAN1_Powertrain', id: '0x7E0', dlc: 8, data: '05 19 04 0A 80 00 01 00', direction: 'Tx', signal_decoded: 'ReadDTCFreezeFrame' },
          { timestamp_ms: 74.5, bus: 'CAN1_Powertrain', id: '0x7E8', dlc: 8, data: '59 04 0A 80 00 28 F1 A0 45', direction: 'Rx', signal_decoded: 'FreezeFrame: Temp=69.5°C' }
        ]
      },
      {
        run_id: 'RUN-2026-BMS-HIL-01',
        test_case_id: 'TC-BMS-042-10',
        req_id: 'REQ-BMS-042',
        test_title: 'Inverter Fast Discharge Cross-Component Synchronization',
        category: 'Cross-Component',
        status: 'PASSED',
        execution_time_ms: 170,
        measured_latency_ms: 32.1,
        allowed_latency_ms: 100.0,
        step_results: [
          { step_num: 1, passed: true, log: 'Emergency CAN 0x050 received by Inverter.', timestamp_ms: 0 },
          { step_num: 2, passed: true, log: 'Inverter DC link capacitor dropped below 60V in 32.1ms.', timestamp_ms: 32.1 }
        ],
        can_trace: [
          { timestamp_ms: 0.0, bus: 'CAN1_Powertrain', id: '0x050', dlc: 8, data: 'EE 00 00 00 00 00 00 00', direction: 'Tx', signal_decoded: 'Emergency_Shutdown' },
          { timestamp_ms: 32.1, bus: 'CAN1_Powertrain', id: '0x128', dlc: 8, data: '00 32 00 00 00 00 00 00', direction: 'Rx', signal_decoded: 'Inverter_Voltage=50V (<60V)' }
        ]
      }
    ]
  }
};
