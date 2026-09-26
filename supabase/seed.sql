-- VeriDrive AI: Initial Seed Data for Demo Requirements and Verification
INSERT INTO requirements (req_key, title, raw_text, ecu, asil_level, category, structured_data, risk_score)
VALUES 
(
    'REQ-BMS-042',
    'High-Voltage Contactor Thermal Derating and Emergency Open Protection',
    'The Battery Management System (BMS) shall monitor high-voltage battery cell temperatures across all 96 serial modules via CAN2_Powertrain and localized thermistor sensor chains. If any individual cell temperature exceeds 60.0°C for more than 50ms under load, the BMS shall derate maximum permissible charge/discharge current by 50% within 100ms and transmit CAN frame BMS_Derate_Status (CAN ID: 0x108, Cycle: 10ms). If any cell temperature exceeds 68.0°C, the BMS shall command the High-Voltage Pyro-Fuse/Contactors to OPEN within 30ms...',
    'BMS (Battery Management System)',
    'ASIL-D',
    'Safety-Critical',
    '{"id": "REQ-BMS-042", "ecu": "BMS", "asil_level": "ASIL-D"}'::jsonb,
    95
),
(
    'REQ-ACC-104',
    'Adaptive Cruise Control Radar Timeout and Smooth Deceleration Fallback',
    'The ADAS Domain Controller shall track forward object velocity and range from the Long-Range Radar (LRR) via CAN_ADAS (CAN ID: 0x220, Cycle: 20ms). If valid radar frames cease to arrive for greater than 100ms while ACC is actively controlling throttle/braking, the ADAS Controller shall transition ACC state from ACTIVE to DEGRADED_COMMS_FALLBACK within 20ms...',
    'ADAS_ECU (Advanced Driver Assistance)',
    'ASIL-B',
    'Safety-Critical',
    '{"id": "REQ-ACC-104", "ecu": "ADAS_ECU", "asil_level": "ASIL-B"}'::jsonb,
    82
),
(
    'REQ-EPB-088',
    'Electronic Parking Brake Dynamic Incline Plausibility and Secondary Hydraulic Clamp',
    'The Electronic Parking Brake (EPB) Electronic Control Unit shall evaluate road gradient from the internal 3-axis accelerometer and external Inertial Measurement Unit (IMU) received over CAN_Chassis (CAN ID: 0x315) prior to clamping brake calipers...',
    'EPB (Electronic Parking Brake)',
    'ASIL-C',
    'Safety-Critical',
    '{"id": "REQ-EPB-088", "ecu": "EPB", "asil_level": "ASIL-C"}'::jsonb,
    88
);
