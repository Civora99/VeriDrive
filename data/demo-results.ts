import { TestCase, CriticReview, TestExecutionResult, SuiteExecutionSummary } from '../lib/types/tests';

export const DEMO_TEST_SUITES: Record<string, TestCase[]> = {
  'REQ-TLM-001': [
    {
      id: 'TC-TLM-001-01',
      req_id: 'REQ-TLM-001',
      title: 'Periodic Cloud Telemetry Transmission at 10-Second Cadence',
      description: 'Verify that when ignition is ON and LTE connection is registered, Telematics ECU publishes vehicle GPS coordinates to cloud broker every 10.0 seconds.',
      category: 'Happy-Path',
      asil_target: 'ASIL-B',
      estimated_duration_ms: 10000,
      preconditions: [
        'Ignition switch (KL15) is ON (12V active)',
        'LTE-M/4G cellular module registered with OEM APN',
        'GNSS receiver has 3D fix with HDOP < 1.5'
      ],
      steps: [
        {
          step_num: 1,
          action: 'Initialize telematics bench with KL15 active, valid GPS lock, and established MQTT/TLS session.',
          can_bus_injection: 'CAN3.0x390: 01 00 00 00 00 00 00 00',
          dwell_time_ms: 100
        },
        {
          step_num: 2,
          action: 'Monitor cloud uplink broker message timestamps over a 60-second measurement window.',
          dwell_time_ms: 60000
        }
      ],
      expected_results: [
        {
          check_num: 1,
          expectation: 'Cloud broker receives exactly 6 consecutive telemetry packets spaced at 10.0s ± 0.25s containing valid GPS fix.',
          can_message_assertion: 'CAN3.0x390: Byte[0] == 0x01 (Uplink Active)',
          max_latency_ms: 10000
        }
      ],
      cleanup: ['Quiesce test bench.'],
      critic_score: 96,
      revised_by_critic: false,
      capl_snippet: `on message CAN3::0x390 {
  testStep("Telemetry Cadence", "Check 10s cloud transmission");
  testStepPass("Payload received in nominal window");
}`
    },
    {
      id: 'TC-TLM-001-02',
      req_id: 'REQ-TLM-001',
      title: '10-Second Periodic Interval Jitter and Drift Boundary',
      description: 'Verify clock jitter and network transmission latency do not exceed maximum permissible tolerance (±500ms) over 100 transmission cycles.',
      category: 'Timing',
      asil_target: 'ASIL-B',
      estimated_duration_ms: 10000,
      preconditions: [
        'Bench synchronized with PTP/NTP network master clock',
        'Cellular network emulator running simulated eNodeB with variable packet delay (20-80ms)'
      ],
      steps: [
        {
          step_num: 1,
          action: 'Arm precision packet sniffer on cellular uplink interface.',
          dwell_time_ms: 50
        },
        {
          step_num: 2,
          action: 'Record inter-arrival delta times for 100 periodic transmissions under varying background CPU load.',
          dwell_time_ms: 100000
        }
      ],
      expected_results: [
        {
          check_num: 1,
          expectation: 'All packet transmission deltas fall strictly between 9,500ms and 10,500ms with no cumulative timer drift.',
          max_latency_ms: 10500
        }
      ],
      cleanup: ['Reset packet sniffer.'],
      critic_score: 95,
      revised_by_critic: true,
      critic_feedback: {
        critique_type: 'Timing',
        comment: 'Critic tightened jitter boundary assertion from ±1000ms to strict ±500ms OEM requirement.',
        suggested_revision: 'Assert interval delta strictly within [9500ms, 10500ms].'
      }
    },
    {
      id: 'TC-TLM-001-03',
      req_id: 'REQ-TLM-001',
      title: 'GNSS Antenna Disconnect / Fix Loss Handling with Last-Known Quality Flag',
      description: 'Confirm ECU behavior when GNSS signal is lost (e.g. entering underground parking or disconnected antenna).',
      category: 'Fault-Injection',
      asil_target: 'ASIL-B',
      estimated_duration_ms: 10000,
      preconditions: ['Ignition ON, cellular connection active, valid initial GPS fix.'],
      steps: [
        {
          step_num: 1,
          action: 'Attenuate GNSS RF simulator signal by -45 dBm to induce fix loss.',
          dwell_time_ms: 500
        },
        {
          step_num: 2,
          action: 'Observe cloud telemetry payload at next 10-second tick.',
          dwell_time_ms: 10000
        }
      ],
      expected_results: [
        {
          check_num: 1,
          expectation: 'ECU transmits packet with GPS_Fix_Valid=FALSE, increments fix_lost_counter, and flags degraded sensor status without crashing.',
          can_message_assertion: 'CAN3.0x390: Byte[1] == 0x00 (Fix Lost)',
          max_latency_ms: 10000
        }
      ],
      cleanup: ['Restore GNSS RF signal power.'],
      critic_score: 92,
      revised_by_critic: false
    },
    {
      id: 'TC-TLM-001-04',
      req_id: 'REQ-TLM-001',
      title: 'Cellular Carrier Outage and Flash Ring-Buffer Queue Ingestion',
      description: 'Verify that when cellular connection drops, telemetry samples are buffered locally in non-volatile flash memory without data loss.',
      category: 'Communication-Loss',
      asil_target: 'ASIL-B',
      estimated_duration_ms: 12000,
      preconditions: ['Ignition ON, valid GPS fix, cellular link active with 0 buffered packets.'],
      steps: [
        {
          step_num: 1,
          action: 'Disable RF carrier on base-station emulator to simulate cellular dead zone for 120 seconds.',
          dwell_time_ms: 1000
        },
        {
          step_num: 2,
          action: 'Verify 12 GPS samples are written into the local eMMC/SPI-flash queue.',
          dwell_time_ms: 120000
        }
      ],
      expected_results: [
        {
          check_num: 1,
          expectation: 'No crash or memory overflow; 12 GPS coordinates stored sequentially in flash buffer.',
          can_message_assertion: 'CAN3.0x390: Byte[2] == 0x0C (Queue Depth 12)'
        }
      ],
      cleanup: ['Re-enable cellular RF carrier.'],
      critic_score: 94,
      revised_by_critic: false
    },
    {
      id: 'TC-TLM-001-05',
      req_id: 'REQ-TLM-001',
      title: 'KL15 Ignition Power Cycle Reboot and Fast Cloud Reconnection',
      description: 'Evaluate ECU bootup sequence, cellular module initialization, and time to first valid GPS cloud transmission following sudden power cycle.',
      category: 'Power-Cycle',
      asil_target: 'ASIL-B',
      estimated_duration_ms: 15000,
      preconditions: ['ECU operating normally on bench with 12V KL30 battery supply.'],
      steps: [
        {
          step_num: 1,
          action: 'Toggle KL15 ignition switch OFF for 5.0 seconds, then toggle back to ON.',
          dwell_time_ms: 5000
        },
        {
          step_num: 2,
          action: 'Measure latency until first authenticated GPS cloud message is received.',
          dwell_time_ms: 15000
        }
      ],
      expected_results: [
        {
          check_num: 1,
          expectation: 'ECU finishes bootloader, initializes modem, acquires GNSS ephemeris, and publishes first message within 15 seconds.',
          max_latency_ms: 15000
        }
      ],
      cleanup: ['Power supply nominal.'],
      critic_score: 93,
      revised_by_critic: true
    },
    {
      id: 'TC-TLM-001-06',
      req_id: 'REQ-TLM-001',
      title: 'Stale Coordinate Lock & Quality Flag Assertion',
      description: 'Verify ECU detects frozen/stale NMEA coordinates from internal GNSS receiver and refuses to publish unverified coordinates as fresh.',
      category: 'Negative',
      asil_target: 'ASIL-B',
      estimated_duration_ms: 10000,
      preconditions: ['Ignition ON, modem connected, GNSS chip injecting frozen coordinate values.'],
      steps: [
        {
          step_num: 1,
          action: 'Freeze NMEA GPRMC sentence coordinate payload while vehicle speed is reported > 50 km/h.',
          dwell_time_ms: 1000
        },
        {
          step_num: 2,
          action: 'Observe position freshness flag over next 3 periodic cycles (30 seconds).',
          dwell_time_ms: 30000
        }
      ],
      expected_results: [
        {
          check_num: 1,
          expectation: 'ECU detects frozen coordinates during motion, asserts position_freshness=STALE (0x02), and logs DTC U0423-82.',
          can_message_assertion: 'CAN3.0x390: Byte[3] == 0x02 (STALE)'
        }
      ],
      cleanup: ['Unfreeze GNSS coordinates.'],
      critic_score: 91,
      revised_by_critic: true
    },
    {
      id: 'TC-TLM-001-07',
      req_id: 'REQ-TLM-001',
      title: 'Cellular Reconnection and Buffered Telemetry Batch Flush',
      description: 'Verify that when cellular signal is restored, ECU reconnects and flushes buffered GPS points in chronological FIFO order.',
      category: 'Recovery',
      asil_target: 'ASIL-B',
      estimated_duration_ms: 15000,
      preconditions: ['ECU has 12 buffered telemetry points in flash from previous cellular outage.'],
      steps: [
        {
          step_num: 1,
          action: 'Re-enable base station RF carrier.',
          dwell_time_ms: 2000
        },
        {
          step_num: 2,
          action: 'Observe LTE modem re-attachment, TLS handshake, and queue draining cadence.',
          dwell_time_ms: 15000
        }
      ],
      expected_results: [
        {
          check_num: 1,
          expectation: 'All 12 buffered packets are transmitted in chronological order with original historical timestamps, followed by resumption of real-time 10s cadence.',
          can_message_assertion: 'CAN3.0x390: Byte[2] == 0x00 (Queue Drained)'
        }
      ],
      cleanup: ['Verify queue empty.'],
      critic_score: 95,
      revised_by_critic: false
    },
    {
      id: 'TC-TLM-001-08',
      req_id: 'REQ-TLM-001',
      title: 'Corrupted NMEA Latitude/Longitude Sentence & Checksum Invalidation',
      description: 'Inject corrupted NMEA checksums and out-of-range coordinates (e.g. Latitude 95.0° N) to verify ECU input sanitization.',
      category: 'Boundary',
      asil_target: 'ASIL-B',
      estimated_duration_ms: 10000,
      preconditions: ['Ignition ON, modem online.'],
      steps: [
        {
          step_num: 1,
          action: 'Inject NMEA sentence with corrupted XOR checksum over internal UART.',
          dwell_time_ms: 100
        },
        {
          step_num: 2,
          action: 'Inject NMEA sentence with invalid latitude value 95.1234° N.',
          dwell_time_ms: 100
        }
      ],
      expected_results: [
        {
          check_num: 1,
          expectation: 'ECU parser rejects malformed sentence; does not broadcast corrupt coordinates to cloud.',
          can_message_assertion: 'CAN3.0x390: Outbound frame suppressed'
        }
      ],
      cleanup: ['Restore nominal NMEA streams.'],
      critic_score: 94,
      revised_by_critic: false
    }
  ],
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
  'REQ-TLM-001': {
    req_id: 'REQ-TLM-001',
    overall_score: 95,
    rigor_rating: 'Exceptional',
    missing_coverage_scenarios: [
      'Original suite lacked check for frozen NMEA sentences when vehicle is moving at highway speeds.',
      'Lacked cellular dead-zone buffer overflow threshold verification.'
    ],
    redundant_test_ids: [],
    ambiguous_expected_results: [
      'Original periodic interval tolerance stated "within a reasonable window" - tightened to strict ±500ms requirement (9,500ms to 10,500ms).'
    ],
    weak_test_conditions: [
      'Cellular outage test was originally only 10 seconds; extended to 120 seconds (12 cycles) to evaluate flash queue depth.'
    ],
    critique_summary: 'Targeted telematics connectivity validation suite. Critic added edge cases for stale coordinate plausibility and flash buffer draining during cellular recovery.',
    recommendations: [
      'Validate LTE modem AT command response timeout in cold-boot test.',
      'Verify MQTT payload compression on low-bandwidth LTE-M links.'
    ],
    original_test_count: 6,
    revised_test_count: 8,
    added_tests_count: 2,
    refined_tests_count: 2
  },
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
  'REQ-TLM-001': {
    run_id: 'RUN-2026-TLM-HIL-01',
    req_id: 'REQ-TLM-001',
    total_tests: 8,
    passed: 7,
    failed: 1,
    blocked: 0,
    average_latency_ms: 12.5,
    max_latency_ms: 30.5,
    execution_date: new Date('2026-03-24T15:30:00Z').toISOString(),
    results: [
      {
        run_id: 'RUN-2026-TLM-HIL-01',
        test_case_id: 'TC-TLM-001-01',
        req_id: 'REQ-TLM-001',
        test_title: 'Periodic Cloud Telemetry Transmission at 10-Second Cadence',
        category: 'Happy-Path',
        status: 'PASSED',
        execution_time_ms: 10020,
        measured_latency_ms: 10.02,
        allowed_latency_ms: 10000.0,
        step_results: [
          { step_num: 1, passed: true, log: 'KL15 active, LTE registered with APN, GPS fix 3D valid.', timestamp_ms: 0 },
          { step_num: 2, passed: true, log: 'Captured 6 consecutive packets at 10.02s mean cadence.', timestamp_ms: 60000 }
        ],
        can_trace: [
          { timestamp_ms: 0.0, bus: 'CAN3_Body', id: '0x390', dlc: 8, data: '01 01 00 00 00 00 00 00', direction: 'Tx', signal_decoded: 'TCU_Status: Connected, GPS_Valid' },
          { timestamp_ms: 10020.0, bus: 'CAN3_Body', id: '0x390', dlc: 8, data: '01 01 00 00 00 00 00 01', direction: 'Tx', signal_decoded: 'Telemetry_Tick: Packet 1 Sent' }
        ]
      },
      {
        run_id: 'RUN-2026-TLM-HIL-01',
        test_case_id: 'TC-TLM-001-02',
        req_id: 'REQ-TLM-001',
        test_title: '10-Second Periodic Interval Jitter and Drift Boundary',
        category: 'Timing',
        status: 'PASSED',
        execution_time_ms: 10100,
        measured_latency_ms: 140.0,
        allowed_latency_ms: 500.0,
        step_results: [
          { step_num: 1, passed: true, log: 'Packet sniffer recorded 100 cycles.', timestamp_ms: 0 },
          { step_num: 2, passed: true, log: 'Max observed jitter: +140ms, Min: -110ms. Within ±500ms bound.', timestamp_ms: 100000 }
        ],
        can_trace: [
          { timestamp_ms: 10140.0, bus: 'CAN3_Body', id: '0x390', dlc: 8, data: '01 01 00 00 00 00 00 02', direction: 'Tx', signal_decoded: 'Jitter_Delta=+140ms' }
        ]
      },
      {
        run_id: 'RUN-2026-TLM-HIL-01',
        test_case_id: 'TC-TLM-001-03',
        req_id: 'REQ-TLM-001',
        test_title: 'GNSS Antenna Disconnect / Fix Loss Handling with Last-Known Quality Flag',
        category: 'Fault-Injection',
        status: 'PASSED',
        execution_time_ms: 10500,
        measured_latency_ms: 8.5,
        allowed_latency_ms: 10000.0,
        step_results: [
          { step_num: 1, passed: true, log: 'GNSS signal attenuated. 3D fix lost.', timestamp_ms: 500 },
          { step_num: 2, passed: true, log: 'Packet transmitted with GPS_Fix_Valid=FALSE; DTC B109F-13 set.', timestamp_ms: 10000 }
        ],
        can_trace: [
          { timestamp_ms: 10000.0, bus: 'CAN3_Body', id: '0x390', dlc: 8, data: '01 00 00 00 00 00 00 03', direction: 'Tx', signal_decoded: 'Fix_Lost_Flag=1' }
        ]
      },
      {
        run_id: 'RUN-2026-TLM-HIL-01',
        test_case_id: 'TC-TLM-001-04',
        req_id: 'REQ-TLM-001',
        test_title: 'Cellular Carrier Outage and Flash Ring-Buffer Queue Ingestion',
        category: 'Communication-Loss',
        status: 'PASSED',
        execution_time_ms: 121000,
        measured_latency_ms: 12.0,
        allowed_latency_ms: 10000.0,
        step_results: [
          { step_num: 1, passed: true, log: 'Carrier muted for 120 seconds.', timestamp_ms: 1000 },
          { step_num: 2, passed: true, log: 'RRC disconnection detected in 2.1s.', timestamp_ms: 3100 },
          { step_num: 3, passed: true, log: '12 points successfully stored in flash buffer queue.', timestamp_ms: 120000 }
        ],
        can_trace: [
          { timestamp_ms: 120000.0, bus: 'CAN3_Body', id: '0x390', dlc: 8, data: '00 01 0C 00 00 00 00 04', direction: 'Tx', signal_decoded: 'Queue_Depth=12' }
        ]
      },
      {
        run_id: 'RUN-2026-TLM-HIL-01',
        test_case_id: 'TC-TLM-001-05',
        req_id: 'REQ-TLM-001',
        test_title: 'KL15 Ignition Power Cycle Reboot and Fast Cloud Reconnection',
        category: 'Power-Cycle',
        status: 'PASSED',
        execution_time_ms: 13200,
        measured_latency_ms: 12800.0,
        allowed_latency_ms: 15000.0,
        step_results: [
          { step_num: 1, passed: true, log: 'KL15 cycled 5s.', timestamp_ms: 5000 },
          { step_num: 2, passed: true, log: 'Cold boot and first cloud payload verified in 12.8s (<15s).', timestamp_ms: 12800 }
        ],
        can_trace: [
          { timestamp_ms: 12800.0, bus: 'CAN3_Body', id: '0x390', dlc: 8, data: '01 01 00 00 00 00 00 05', direction: 'Tx', signal_decoded: 'First_Transmission_Active' }
        ]
      },
      {
        run_id: 'RUN-2026-TLM-HIL-01',
        test_case_id: 'TC-TLM-001-06',
        req_id: 'REQ-TLM-001',
        test_title: 'Stale Coordinate Lock & Quality Flag Assertion',
        category: 'Negative',
        status: 'FAILED',
        execution_time_ms: 30500,
        measured_latency_ms: 28500.0,
        allowed_latency_ms: 3000.0,
        step_results: [
          { step_num: 1, passed: true, log: 'Frozen NMEA coordinates injected at 65 km/h.', timestamp_ms: 1000 },
          { step_num: 2, passed: false, log: 'DEFECT DETECTED: Quality flag remained locked at VALID (0x01) for 28.5s instead of transitioning to STALE within 3.0s!', timestamp_ms: 28500 }
        ],
        can_trace: [
          { timestamp_ms: 1000.0, bus: 'CAN3_Body', id: '0x390', dlc: 8, data: '01 01 00 01 00 00 00 06', direction: 'Tx', signal_decoded: 'Quality_Flag=VALID (0x01)' },
          { timestamp_ms: 28500.0, bus: 'CAN3_Body', id: '0x390', dlc: 8, data: '01 01 00 01 00 00 00 06', direction: 'Tx', signal_decoded: 'STALE_FLAG_FAILED_TO_SET' }
        ],
        defect: {
          id: 'DEF-TLM-001',
          test_case_id: 'TC-TLM-001-06',
          req_id: 'REQ-TLM-001',
          ecu: 'TCU (Telematics Control Unit)',
          severity: 'High',
          summary: 'Stale GPS Coordinate Transmission During Dead-Reckoning Timeout',
          root_cause: 'In telematics gnss_filter.c line 248, the staleness debounce timer counter overflows on 16-bit register arithmetic, delaying STALE flag transition.',
          can_discrepancy: 'CAN ID 0x390 Byte 3 remained 0x01 (VALID) for 28.5 seconds while vehicle speed was 65 km/h.',
          actual_vs_expected: 'Expected: Quality flag must be set to STALE (0x02) after 3.0s without fresh coordinates. Actual: Stayed VALID for 28.5s.',
          recommended_fix: 'Promote debounce counter in `gnss_filter.c` to `uint32_t` and bound maximum timeout to 3,000ms with explicit clamp.'
        }
      },
      {
        run_id: 'RUN-2026-TLM-HIL-01',
        test_case_id: 'TC-TLM-001-07',
        req_id: 'REQ-TLM-001',
        test_title: 'Cellular Reconnection and Buffered Telemetry Batch Flush',
        category: 'Recovery',
        status: 'PASSED',
        execution_time_ms: 15300,
        measured_latency_ms: 4200.0,
        allowed_latency_ms: 15000.0,
        step_results: [
          { step_num: 1, passed: true, log: 'Cellular carrier restored.', timestamp_ms: 2000 },
          { step_num: 2, passed: true, log: '12 buffered packets drained in FIFO sequence in 4.2s.', timestamp_ms: 6200 }
        ],
        can_trace: [
          { timestamp_ms: 6200.0, bus: 'CAN3_Body', id: '0x390', dlc: 8, data: '01 01 00 00 00 00 00 07', direction: 'Tx', signal_decoded: 'Queue_Drained_Successfully' }
        ]
      },
      {
        run_id: 'RUN-2026-TLM-HIL-01',
        test_case_id: 'TC-TLM-001-08',
        req_id: 'REQ-TLM-001',
        test_title: 'Corrupted NMEA Latitude/Longitude Sentence & Checksum Invalidation',
        category: 'Boundary',
        status: 'PASSED',
        execution_time_ms: 10200,
        measured_latency_ms: 1.2,
        allowed_latency_ms: 50.0,
        step_results: [
          { step_num: 1, passed: true, log: 'Corrupted XOR checksum injected.', timestamp_ms: 100 },
          { step_num: 2, passed: true, log: 'Invalid latitude 95.1234° N rejected by sanitization layer.', timestamp_ms: 200 }
        ],
        can_trace: [
          { timestamp_ms: 200.0, bus: 'CAN3_Body', id: '0x390', dlc: 8, data: '01 01 00 00 01 00 00 08', direction: 'Tx', signal_decoded: 'Sanitization_Drop=CorruptNMEA' }
        ]
      }
    ]
  },
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
