-- ====================================================================
-- VeriDrive AI: Supabase Seed Data
-- Embedded Automotive Requirements-to-Validation Platform
-- ====================================================================

-- Static Deterministic UUIDs for Seed Relations
-- Requirement REQ-TLM-001: 11111111-1111-1111-1111-111111111111
-- Analysis Run:            22222222-2222-2222-2222-222222222222
-- Test Run:                33333333-3333-3333-3333-333333333333
-- Defect:                  44444444-4444-4444-4444-444444444444

-- Clean prior seed items if running re-seed
DELETE FROM requirements WHERE requirement_key = 'REQ-TLM-001';

-- ====================================================================
-- 1. SEED REQUIREMENT: REQ-TLM-001
-- ====================================================================
INSERT INTO requirements (
    id,
    requirement_key,
    source_name,
    raw_text,
    component,
    requirement_type,
    summary,
    inputs,
    outputs,
    conditions,
    constraints,
    interfaces,
    dependencies,
    risks,
    classification_confidence,
    created_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'REQ-TLM-001',
    'OEM Connected Vehicle Architecture Specification v3.2',
    'The telematics ECU shall transmit the vehicle GPS position to the cloud every 10 seconds when ignition is ON and a valid cellular connection is available.',
    'Telematics Control Unit (TCU)',
    'Connectivity / Functional',
    'Periodic cloud telemetry transmission of vehicle GPS coordinates via LTE/5G cellular gateway.',
    '[
        {"name": "Ignition_State_KL15", "type": "boolean", "interface_bus": "Hardwired 12V / CAN_Body", "description": "Vehicle ignition status (ON/OFF)"},
        {"name": "GNSS_Position_Data", "type": "NMEA-0183 (lat, lon, alt, heading)", "interface_bus": "Internal UART/SPI", "description": "High-precision GPS/Galileo coordinate telemetry"},
        {"name": "Cellular_Network_State", "type": "enum (CONNECTED, DISCONNECTED, ROAMING)", "interface_bus": "Internal Modem AT/QMI", "description": "LTE-M/4G cellular registration status"}
    ]'::jsonb,
    '[
        {"name": "Cloud_GPS_Telemetry_Payload", "type": "Protobuf / JSON over MQTT", "interface_bus": "Cellular LTE / TLS 1.3", "description": "Encrypted periodic vehicle coordinate message to OEM cloud broker"},
        {"name": "Telemetry_Transmit_Status", "type": "CAN Frame (0x390)", "interface_bus": "CAN_Body", "description": "TCU uplink handshake and transmission status indicator"}
    ]'::jsonb,
    '[
        "Ignition switch KL15 is asserted (12V active)",
        "Valid cellular registration with OEM APN and IP connectivity established",
        "Vehicle power supply between 9.0V and 16.0V DC"
    ]'::jsonb,
    '[
        {"metric": "Transmission Cadence", "value": "10.0 seconds", "tolerance": "±500 ms"},
        {"metric": "Payload Size Cap", "value": "512 bytes"},
        {"metric": "Max Retries on Loss", "value": "3 attempts before flash buffering"}
    ]'::jsonb,
    '[
        "Cellular LTE-M / 4G (ISO 17987 / 3GPP Rel 14)",
        "Internal GNSS Antenna (GPS L1, GLONASS G1, Galileo E1)",
        "CAN 2.0B Body Bus (500 kbps)",
        "Cloud MQTT v5.0 over TLS 1.3"
    ]'::jsonb,
    '[
        "OEM Cloud Ingestion Broker (AWS IoT Core / Azure IoT Hub)",
        "Cellular SIM Provisioning and Subscription validity",
        "GNSS Satellite Constellation visibility"
    ]'::jsonb,
    '[
        {"risk": "Data Loss in Tunnels", "severity": "Medium", "mitigation": "Non-volatile flash ring-buffer for up to 1,000 telemetry points"},
        {"risk": "Stale Location Spoofing", "severity": "High", "mitigation": "Timestamp freshness assertion and GNSS fix quality validation"}
    ]'::jsonb,
    0.96,
    now()
);

-- ====================================================================
-- 2. SEED ANALYSIS RUN
-- ====================================================================
INSERT INTO analysis_runs (
    id,
    requirement_id,
    model_name,
    analysis_json,
    status,
    created_at
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'gemini-2.5-flash',
    '{
        "requirement_id": "REQ-TLM-001",
        "clarity_score": 96,
        "testability_score": 94,
        "identified_aspects": {
            "timing_criticality": "Periodic (10s ± 500ms)",
            "communication_layer": "LTE / MQTT / CAN",
            "safety_implication": "QM / ASIL-A (telemetry logging / fleet tracking)",
            "failure_mitigation": "Store-and-forward flash buffer required"
        },
        "audit_findings": [
            "Clear deterministic periodicity (10s) specified.",
            "Preconditions (Ignition ON, Cellular Available) explicitly verified.",
            "Recommended adding buffer queue depth constraint during network drop."
        ]
    }'::jsonb,
    'COMPLETED',
    now()
);

-- ====================================================================
-- 3. SEED TEST CASES (8 Targeted Automotive Scenarios)
-- ====================================================================

-- 3.1 Normal Operation
INSERT INTO test_cases (
    id,
    requirement_id,
    test_key,
    title,
    category,
    objective,
    preconditions,
    test_steps,
    inputs,
    expected_result,
    pass_criteria,
    priority,
    risk_level,
    generated_by,
    critic_status,
    created_at
) VALUES (
    'b0000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'TC-TLM-001-01',
    'Periodic Cloud Telemetry Transmission at 10-Second Cadence',
    'normal operation',
    'Verify that when ignition is ON and LTE connection is registered, Telematics ECU publishes vehicle GPS coordinates to the cloud broker every 10.0 seconds.',
    'Ignition switch (KL15) is ON (12V active). LTE-M/4G cellular module registered with OEM APN. GNSS receiver has 3D fix with HDOP < 1.5.',
    '[
        {"step_num": 1, "action": "Initialize telematics bench with KL15 active, valid GPS lock (37.7749° N, -122.4194° W), and established MQTT/TLS session to OEM cloud gateway.", "dwell_time_ms": 100},
        {"step_num": 2, "action": "Monitor cloud uplink broker message timestamps over a 60-second measurement window.", "dwell_time_ms": 60000}
    ]'::jsonb,
    '{"ignition_state": "ON", "cellular_status": "CONNECTED_4G", "gnss_fix": "3D_FIX", "reporting_interval_s": 10}'::jsonb,
    'Cloud broker receives exactly 6 consecutive telemetry packets spaced at 10.0s ± 0.25s containing valid GPS fix.',
    'Interval between successive payloads is between 9.75s and 10.25s; MQTT payload contains valid ISO 8601 timestamp and coordinates.',
    'High',
    'Medium',
    'AI-Generator',
    'APPROVED',
    now()
);

-- 3.2 Timing Boundary
INSERT INTO test_cases (
    id,
    requirement_id,
    test_key,
    title,
    category,
    objective,
    preconditions,
    test_steps,
    inputs,
    expected_result,
    pass_criteria,
    priority,
    risk_level,
    generated_by,
    critic_status,
    created_at
) VALUES (
    'b0000000-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'TC-TLM-001-02',
    '10-Second Periodic Interval Jitter and Drift Boundary',
    'timing boundary',
    'Verify that clock jitter and network transmission latency do not exceed maximum permissible tolerance (±500ms) over 100 transmission cycles.',
    'Bench synchronized with PTP/NTP network master clock. Cellular network emulator running simulated eNodeB with variable packet delay (20-80ms).',
    '[
        {"step_num": 1, "action": "Arm precision packet sniffer on cellular uplink interface.", "dwell_time_ms": 50},
        {"step_num": 2, "action": "Record inter-arrival delta times for 100 periodic transmissions under varying background CPU load.", "dwell_time_ms": 100000}
    ]'::jsonb,
    '{"interval_nominal_ms": 10000, "jitter_tolerance_ms": 500, "cycle_count": 100}'::jsonb,
    'All packet transmission deltas fall strictly between 9,500ms and 10,500ms with no cumulative timer drift.',
    'Max delta <= 10500ms, Min delta >= 9500ms, standard deviation < 120ms.',
    'High',
    'High',
    'AI-Generator',
    'APPROVED',
    now()
);

-- 3.3 GPS Unavailable
INSERT INTO test_cases (
    id,
    requirement_id,
    test_key,
    title,
    category,
    objective,
    preconditions,
    test_steps,
    inputs,
    expected_result,
    pass_criteria,
    priority,
    risk_level,
    generated_by,
    critic_status,
    created_at
) VALUES (
    'b0000000-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'TC-TLM-001-03',
    'GNSS Antenna Disconnect / Fix Loss Handling with Last-Known Quality Flag',
    'GPS unavailable',
    'Confirm ECU behavior when GNSS signal is lost (e.g. entering underground parking or disconnected antenna).',
    'Ignition ON, cellular connection active, valid initial GPS fix.',
    '[
        {"step_num": 1, "action": "Attenuate GNSS RF simulator signal by -45 dBm to induce fix loss.", "dwell_time_ms": 500},
        {"step_num": 2, "action": "Observe cloud telemetry payload at next 10-second tick.", "dwell_time_ms": 10000}
    ]'::jsonb,
    '{"gnss_rf_power_dbm": -150, "satellite_count": 0, "fix_status": "NO_FIX"}'::jsonb,
    'ECU transmits packet with GPS_Fix_Valid=FALSE, increments fix_lost_counter, and flags degraded sensor status without crashing.',
    'Packet transmitted at t=10s with quality_flag=0x00 and DTC B109F-13 (GPS Antenna Open Circuit) logged in NVM.',
    'Critical',
    'High',
    'AI-Critic',
    'APPROVED',
    now()
);

-- 3.4 Cellular Unavailable
INSERT INTO test_cases (
    id,
    requirement_id,
    test_key,
    title,
    category,
    objective,
    preconditions,
    test_steps,
    inputs,
    expected_result,
    pass_criteria,
    priority,
    risk_level,
    generated_by,
    critic_status,
    created_at
) VALUES (
    'b0000000-0000-0000-0000-000000000004',
    '11111111-1111-1111-1111-111111111111',
    'TC-TLM-001-04',
    'Cellular Carrier Outage and Flash Ring-Buffer Queue Ingestion',
    'cellular unavailable',
    'Verify that when cellular connection drops, telemetry samples are buffered locally in non-volatile flash memory without data loss.',
    'Ignition ON, valid GPS fix, cellular link active with 0 buffered packets.',
    '[
        {"step_num": 1, "action": "Disable RF carrier on base-station emulator to simulate cellular dead zone for 120 seconds (12 cycles).", "dwell_time_ms": 1000},
        {"step_num": 2, "action": "Verify ECU detects RRC connection loss within 3.0 seconds.", "dwell_time_ms": 3000},
        {"step_num": 3, "action": "Verify 12 GPS samples are written into the local eMMC/SPI-flash queue.", "dwell_time_ms": 117000}
    ]'::jsonb,
    '{"cellular_rf": "MUTED", "outage_duration_s": 120, "expected_buffered_samples": 12}'::jsonb,
    'No HTTP/MQTT timeout crash; all 12 GPS coordinates stored sequentially in flash buffer.',
    'Flash ring-buffer queue depth reaches exactly 12 items; no memory leak or watchdog trip.',
    'Critical',
    'High',
    'AI-Generator',
    'APPROVED',
    now()
);

-- 3.5 ECU Restart
INSERT INTO test_cases (
    id,
    requirement_id,
    test_key,
    title,
    category,
    objective,
    preconditions,
    test_steps,
    inputs,
    expected_result,
    pass_criteria,
    priority,
    risk_level,
    generated_by,
    critic_status,
    created_at
) VALUES (
    'b0000000-0000-0000-0000-000000000005',
    '11111111-1111-1111-1111-111111111111',
    'TC-TLM-001-05',
    'KL15 Ignition Power Cycle Reboot and Fast Cloud Reconnection',
    'ECU restart',
    'Evaluate ECU bootup sequence, cellular module initialization, and time to first valid GPS cloud transmission following sudden power cycle.',
    'ECU operating normally on bench with 12V KL30 battery supply.',
    '[
        {"step_num": 1, "action": "Toggle KL15 ignition switch OFF for 5.0 seconds, then toggle back to ON.", "dwell_time_ms": 5000},
        {"step_num": 2, "action": "Start timer at KL15 ON edge and measure latency until first authenticated GPS cloud message is received.", "dwell_time_ms": 15000}
    ]'::jsonb,
    '{"power_event": "KL15_CYCLE", "off_dwell_s": 5, "max_allowable_boot_s": 15}'::jsonb,
    'ECU finishes bootloader, initializes modem, acquires GNSS ephemeris, and publishes first message within 15 seconds.',
    'Time to First Transmission (TTFT) <= 15.0 seconds with zero buffer corruption.',
    'High',
    'Medium',
    'AI-Critic',
    'APPROVED',
    now()
);

-- 3.6 Stale GPS Data
INSERT INTO test_cases (
    id,
    requirement_id,
    test_key,
    title,
    category,
    objective,
    preconditions,
    test_steps,
    inputs,
    expected_result,
    pass_criteria,
    priority,
    risk_level,
    generated_by,
    critic_status,
    created_at
) VALUES (
    'b0000000-0000-0000-0000-000000000006',
    '11111111-1111-1111-1111-111111111111',
    'TC-TLM-001-06',
    'Stale Coordinate Lock & Quality Flag Assertion',
    'stale GPS data',
    'Verify ECU detects frozen/stale NMEA coordinates from internal GNSS receiver and refuses to publish unverified coordinates as fresh.',
    'Ignition ON, modem connected, GNSS chip injecting frozen coordinate values.',
    '[
        {"step_num": 1, "action": "Freeze NMEA GPRMC sentence coordinate payload while vehicle speed is reported > 50 km/h.", "dwell_time_ms": 1000},
        {"step_num": 2, "action": "Observe position freshness flag over next 3 periodic cycles (30 seconds).", "dwell_time_ms": 30000}
    ]'::jsonb,
    '{"lat": 37.7749, "lon": -122.4194, "frozen_duration_s": 30, "speed_kph": 65}'::jsonb,
    'ECU detects that coordinates have ceased changing despite vehicle motion, flags staleness, and asserts position_freshness=STALE (0x02).',
    'Cloud payload contains stale_warning_flag=true; DTC U0423-82 (Invalid GNSS Data) logged.',
    'High',
    'High',
    'AI-Critic',
    'APPROVED',
    now()
);

-- 3.7 Recovery
INSERT INTO test_cases (
    id,
    requirement_id,
    test_key,
    title,
    category,
    objective,
    preconditions,
    test_steps,
    inputs,
    expected_result,
    pass_criteria,
    priority,
    risk_level,
    generated_by,
    critic_status,
    created_at
) VALUES (
    'b0000000-0000-0000-0000-000000000007',
    '11111111-1111-1111-1111-111111111111',
    'TC-TLM-001-07',
    'Cellular Reconnection and Buffered Telemetry Batch Flush',
    'recovery',
    'Verify that when cellular signal is restored, the ECU reconnects and safely flushes buffered GPS points in chronological FIFO order without overwhelming the network.',
    'ECU has 12 buffered telemetry points in flash from previous cellular outage.',
    '[
        {"step_num": 1, "action": "Re-enable base station RF carrier.", "dwell_time_ms": 2000},
        {"step_num": 2, "action": "Observe LTE modem re-attachment, TLS handshake, and queue draining cadence.", "dwell_time_ms": 15000}
    ]'::jsonb,
    '{"reconnect_event": "LTE_ATTACHED", "queued_packets": 12, "batch_size_limit": 5}'::jsonb,
    'All 12 buffered packets are transmitted in chronological order with original historical timestamps, followed by resumption of real-time 10s cadence.',
    'Queue depth returns to 0; no duplicate messages; normal 10s period resumed.',
    'High',
    'Medium',
    'AI-Generator',
    'APPROVED',
    now()
);

-- 3.8 Invalid Data
INSERT INTO test_cases (
    id,
    requirement_id,
    test_key,
    title,
    category,
    objective,
    preconditions,
    test_steps,
    inputs,
    expected_result,
    pass_criteria,
    priority,
    risk_level,
    generated_by,
    critic_status,
    created_at
) VALUES (
    'b0000000-0000-0000-0000-000000000008',
    '11111111-1111-1111-1111-111111111111',
    'TC-TLM-001-08',
    'Corrupted NMEA Latitude/Longitude Sentence & Checksum Invalidation',
    'invalid data',
    'Inject corrupted NMEA checksums and out-of-range coordinates (e.g. Latitude 95.0° N) to verify ECU input sanitization.',
    'Ignition ON, modem online.',
    '[
        {"step_num": 1, "action": "Inject NMEA sentence with corrupted XOR checksum over internal UART.", "dwell_time_ms": 100},
        {"step_num": 2, "action": "Inject NMEA sentence with invalid latitude value 95.1234° N (range is -90° to +90°).", "dwell_time_ms": 100},
        {"step_num": 3, "action": "Monitor outbound cellular packet payload.", "dwell_time_ms": 10000}
    ]'::jsonb,
    '{"malformed_nmea": "$GPRMC,123519,A,9507.038,N,01131.000,E,022.4,084.4,230326,003.1,W*99"}'::jsonb,
    'ECU parser rejects malformed sentence; does not broadcast corrupt coordinates to cloud.',
    'No outbound packet contains out-of-range latitude; input validation error logged in system diagnostics.',
    'High',
    'High',
    'AI-Critic',
    'APPROVED',
    now()
);

-- ====================================================================
-- 4. SEED DEFECT (Demonstrating Stale GPS Failure on TC-TLM-001-06)
-- ====================================================================
INSERT INTO defects (
    id,
    test_case_id,
    title,
    severity,
    description,
    expected_behavior,
    observed_behavior,
    likely_area,
    created_at
) VALUES (
    '44444444-4444-4444-4444-444444444444',
    'b0000000-0000-0000-0000-000000000006',
    'Stale GPS Coordinate Transmission During Dead-Reckoning Timeout',
    'High',
    'When GPS fix is lost or frozen in tunnels, the telematics dead-reckoning filter continues emitting stale coordinates with quality_flag incorrectly asserted as VALID (0x01).',
    'Quality flag must transition to STALE (0x02) after 3.0 consecutive seconds without fresh GNSS ephemeris.',
    'Quality flag remained locked at VALID (0x01) for 28.5 seconds before transitioning.',
    'telematics/gnss_filter.c: line 248 (staleness debounce counter overflow)',
    now()
);

-- ====================================================================
-- 5. SEED TEST RUN
-- ====================================================================
INSERT INTO test_runs (
    id,
    requirement_id,
    run_name,
    total_tests,
    passed,
    failed,
    blocked,
    simulated,
    created_at
) VALUES (
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'HIL_Automated_Suite_REQ_TLM_001',
    8,
    7,
    1,
    0,
    true,
    now()
);

-- ====================================================================
-- 6. SEED TEST RESULTS (7 Passed, 1 Failed with Defect Link)
-- ====================================================================
INSERT INTO test_results (test_run_id, test_case_id, status, observed_result, failure_reason, defect_id, execution_time_ms) VALUES
('33333333-3333-3333-3333-333333333333', 'b0000000-0000-0000-0000-000000000001', 'PASSED', '6 consecutive packets received at exactly 10.02s mean delta with valid 3D GPS fix.', NULL, NULL, 60100),
('33333333-3333-3333-3333-333333333333', 'b0000000-0000-0000-0000-000000000002', 'PASSED', 'Max observed inter-arrival delta was 10,140ms; min was 9,890ms. Jitter within ±500ms limit.', NULL, NULL, 100200),
('33333333-3333-3333-3333-333333333333', 'b0000000-0000-0000-0000-000000000003', 'PASSED', 'ECU reported GPS_Fix_Valid=FALSE at t=10s and stored DTC B109F-13 without system fault.', NULL, NULL, 10500),
('33333333-3333-3333-3333-333333333333', 'b0000000-0000-0000-0000-000000000004', 'PASSED', '12 GPS coordinates buffered into SPI flash during 120s network mute; zero packet loss.', NULL, NULL, 121000),
('33333333-3333-3333-3333-333333333333', 'b0000000-0000-0000-0000-000000000005', 'PASSED', 'ECU completed cold boot, established LTE bearer, and transmitted first packet in 12.8s (<15s).', NULL, NULL, 13200),
('33333333-3333-3333-3333-333333333333', 'b0000000-0000-0000-0000-000000000006', 'FAILED', 'Quality flag remained VALID (0x01) for 28.5s despite vehicle moving 65 km/h with frozen coordinates.', 'Stale coordinate debounce timer failed to assert STALE flag within 3.0s window.', '44444444-4444-4444-4444-444444444444', 30500),
('33333333-3333-3333-3333-333333333333', 'b0000000-0000-0000-0000-000000000007', 'PASSED', 'Flash queue of 12 historical packets drained in FIFO sequence in 4.2s upon LTE re-attachment.', NULL, NULL, 15300),
('33333333-3333-3333-3333-333333333333', 'b0000000-0000-0000-0000-000000000008', 'PASSED', 'Corrupted NMEA checksum and latitude 95.1234° N rejected at UART driver; no bogus cloud transmission.', NULL, NULL, 10200);

-- ====================================================================
-- 7. SEED TRACEABILITY LINKS (REQ-TLM-001 <-> All 8 Test Cases)
-- ====================================================================
INSERT INTO traceability_links (requirement_id, test_case_id, coverage_type) VALUES
('11111111-1111-1111-1111-111111111111', 'b0000000-0000-0000-0000-000000000001', 'Functional_Nominal'),
('11111111-1111-1111-1111-111111111111', 'b0000000-0000-0000-0000-000000000002', 'Timing_Boundary'),
('11111111-1111-1111-1111-111111111111', 'b0000000-0000-0000-0000-000000000003', 'Sensor_Fault_Injection'),
('11111111-1111-1111-1111-111111111111', 'b0000000-0000-0000-0000-000000000004', 'Communication_Loss'),
('11111111-1111-1111-1111-111111111111', 'b0000000-0000-0000-0000-000000000005', 'Power_Cycle_Recovery'),
('11111111-1111-1111-1111-111111111111', 'b0000000-0000-0000-0000-000000000006', 'Data_Freshness_Plausibility'),
('11111111-1111-1111-1111-111111111111', 'b0000000-0000-0000-0000-000000000007', 'Recovery_Flush'),
('11111111-1111-1111-1111-111111111111', 'b0000000-0000-0000-0000-000000000008', 'Input_Sanitization_Negative');
