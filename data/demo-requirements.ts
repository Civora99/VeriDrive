import { StructuredRequirement } from '../lib/types/requirements';

export const DEMO_REQUIREMENTS: StructuredRequirement[] = [
  {
    id: 'REQ-TLM-001',
    title: 'Periodic Vehicle GPS Position Cloud Telemetry Transmission',
    raw_text: 'The telematics ECU shall transmit the vehicle GPS position to the cloud every 10 seconds when ignition is ON and a valid cellular connection is available.',
    ecu: 'TCU (Telematics Control Unit)',
    asil_level: 'ASIL-B',
    category: 'Communication',
    inputs: [
      { name: 'Ignition_State_KL15', type: 'boolean (12V)', interface_bus: 'Hardwired 12V / CAN_Body', description: 'Vehicle ignition position (1=ON, 0=OFF)' },
      { name: 'GNSS_Position_Data', type: 'NMEA-0183 coordinate sentence', interface_bus: 'Internal UART/SPI', description: 'Latitude, longitude, altitude, heading, HDOP' },
      { name: 'Cellular_Network_State', type: 'enum (CONNECTED, DISCONNECTED, ROAMING)', interface_bus: 'Modem AT Command Interface', description: 'LTE-M/4G packet network registration' }
    ],
    outputs: [
      { name: 'Cloud_GPS_Telemetry_Payload', type: 'Protobuf / JSON over MQTT', interface_bus: 'Cellular LTE / TLS 1.3', description: 'Periodic encrypted GPS coordinates uplink to OEM cloud broker' },
      { name: 'Telemetry_Transmit_Status (0x390)', type: 'CAN Frame (100ms)', interface_bus: 'CAN_Body', description: 'TCU uplink transmission handshake and buffer status' }
    ],
    triggers: [
      'Periodic timer tick expired (T = 10.0 seconds)',
      'Ignition transition from OFF to ON',
      'Cellular reconnection trigger after network outage'
    ],
    conditions: [
      'Ignition switch KL15 is asserted (12V active)',
      'Valid cellular carrier connection and OEM APN IP established',
      'Vehicle supply voltage between 9.0V and 16.0V DC'
    ],
    timing_constraints: [
      { metric: 'Periodic Telemetry Reporting Cadence', max_latency_ms: 10000, tolerance_ms: 500, notes: 'Broadcast interval: 10.0s ± 0.5s' },
      { metric: 'Time to First Transmission after Boot', max_latency_ms: 15000, tolerance_ms: 1000, notes: 'Max 15s to establish cloud session after KL15' }
    ],
    interfaces: [
      'Cellular LTE-M / 4G (ISO 17987 / 3GPP Rel 14)',
      'Internal GNSS Receiver (GPS, GLONASS, Galileo)',
      'CAN 2.0B Body Bus (500 kbps)',
      'Cloud MQTT v5.0 over TLS 1.3'
    ],
    dependencies: [
      'OEM Cloud Telemetry Ingestion Broker',
      'Cellular Carrier SIM Subscription'
    ],
    failure_conditions: [
      'Cellular dead-zone / out-of-coverage (buffer up to 1,000 coordinates)',
      'GNSS antenna disconnect or fix loss',
      'Stale coordinate freeze while vehicle is in motion'
    ],
    safety_related_wording: [
      'Ensure high integrity of crash and telemetry positioning data.',
      'Safe state: Store coordinates in non-volatile flash ring-buffer upon network drop.'
    ],
    diagnostic_implications: [
      { dtc_code: 'B109F-13', service_id: '0x19', description: 'GPS Antenna Open Circuit or Disconnected', freeze_frame_required: true },
      { dtc_code: 'U0423-82', service_id: '0x19', description: 'Invalid or Stale GNSS Coordinate Telemetry', freeze_frame_required: false }
    ],
    risk_score: 78,
    confidence_score: 96,
    created_at: new Date('2026-03-24T10:00:00Z').toISOString(),
    status: 'Validated'
  },
  {
    id: 'REQ-BMS-042',
    title: 'High-Voltage Contactor Thermal Derating and Emergency Open Protection',
    raw_text: `The Battery Management System (BMS) shall monitor high-voltage battery cell temperatures across all 96 serial modules via CAN2_Powertrain and localized thermistor sensor chains.
If any individual cell temperature exceeds 60.0°C for more than 50ms under load, the BMS shall derate maximum permissible charge/discharge current by 50% within 100ms and transmit CAN frame BMS_Derate_Status (CAN ID: 0x108, Cycle: 10ms).
If any cell temperature exceeds 68.0°C (thermal hazard threshold), the BMS shall:
1. Immediately command the High-Voltage Pyro-Fuse / Main Positive and Negative Contactors to OPEN within 30ms.
2. Assert hardwired safety flag HVIL_TRIP_DISCRETE to 0V (logic LOW).
3. Transmit high-priority emergency broadcast CAN frame BMS_Emergency_Shutdown (CAN ID: 0x050, Cycle: 5ms, DLC: 8, Byte 0 = 0xEE).
4. Log persistent Diagnostic Trouble Code (DTC) P0A80-00 (Hybrid/EV Battery Pack Degradation/Overheat) with ISO 14229 Freeze Frame record including max cell temp, pack current, and contactor voltage delta.
Contactor re-closure shall be strictly inhibited until KL15 (Ignition) power cycle and an authorized UDS 0x14 ClearDiagnosticInformation service command is received.`,
    ecu: 'BMS (Battery Management System)',
    asil_level: 'ASIL-D',
    category: 'Safety-Critical',
    inputs: [
      { name: 'Cell_Temp_Array[96]', type: 'float[96] (°C)', interface_bus: 'Internal SPI / CAN2', description: 'Real-time temperature probes across battery pack modules' },
      { name: 'Pack_Current_HV', type: 'float (A)', interface_bus: 'CAN2_Powertrain (0x102)', description: 'Total pack discharge/charge current from Hall-effect sensor' },
      { name: 'KL15_Ignition_State', type: 'boolean (0/1)', interface_bus: 'Hardwired 12V / CAN3_Body', description: 'Vehicle ignition switch position' },
      { name: 'HVIL_Interlock_Feedback', type: 'voltage (0-12V)', interface_bus: 'Hardwired Discrete', description: 'High Voltage Interlock Loop continuity circuit' }
    ],
    outputs: [
      { name: 'HV_Contactor_Pos_Cmd', type: 'discrete (0=Open, 1=Closed)', interface_bus: 'Low-Side Driver GPIO', description: 'Main positive contactor solenoid control' },
      { name: 'HV_Contactor_Neg_Cmd', type: 'discrete (0=Open, 1=Closed)', interface_bus: 'Low-Side Driver GPIO', description: 'Main negative contactor solenoid control' },
      { name: 'BMS_Derate_Status (0x108)', type: 'CAN Frame (10ms)', interface_bus: 'CAN1_Powertrain', description: 'Derating limit broadcast for Inverter and Charger' },
      { name: 'BMS_Emergency_Shutdown (0x050)', type: 'CAN Frame (5ms, DLC 8)', interface_bus: 'CAN1_Powertrain', description: 'Emergency propulsion cutoff broadcast' },
      { name: 'DTC P0A80-00', type: 'UDS DTC Record', interface_bus: 'Diagnostic Memory (NVM)', description: 'Freeze-frame diagnostic trouble code' }
    ],
    triggers: [
      'Cell temperature reaches or exceeds 60.0°C continuously for > 50ms',
      'Cell temperature reaches or exceeds 68.0°C threshold (Instant Safety Trip)',
      'HVIL loop break detected'
    ],
    conditions: [
      'High Voltage Pack is energized (Contactors Closed)',
      'Vehicle is in DRIVE or FAST_CHARGE operating state',
      'Ambient temperature between -40°C and +85°C'
    ],
    timing_constraints: [
      { metric: 'Thermal Derating Response Latency', max_latency_ms: 100, tolerance_ms: 10, notes: 'Current derate command transmitted on CAN' },
      { metric: 'Emergency Contactor Open Reaction Time', max_latency_ms: 30, tolerance_ms: 5, notes: 'Hardware solenoid de-energization following 68°C trigger' },
      { metric: 'Emergency CAN 0x050 Transmission Delay', max_latency_ms: 10, tolerance_ms: 2, notes: 'First emergency frame on CAN1' }
    ],
    interfaces: [
      'CAN1_Powertrain (500 kbps, 11-bit identifier)',
      'CAN2_Internal_Battery (1 Mbps CAN-FD, 29-bit identifier)',
      'Hardwired 12V Solenoid Gate Drivers (Low-Side PWM)',
      'UDS on CAN (ISO 14229 / ISO 15765-2 DoCAN)'
    ],
    dependencies: [
      'Inverter Motor Controller (MCU) respect of current limit',
      '12V Auxiliary Battery supply retention during emergency cutoff'
    ],
    failure_conditions: [
      'Thermistor wire break / open circuit (reads -50°C fallback)',
      'Contactor weld / stuck-closed mechanical fault',
      'CAN bus-off state on CAN1_Powertrain'
    ],
    safety_related_wording: [
      'ISO 26262 Part 4 ASIL-D Functional Safety Goal: Avoid thermal propagation and high-voltage fire hazard.',
      'Single point fault metric (SPFM) > 99%.',
      'Safe state: De-energize high-voltage contactors within 30ms.'
    ],
    diagnostic_implications: [
      { dtc_code: 'P0A80-00', service_id: '0x19', description: 'Hybrid/EV Battery Pack Overheat Level 2', freeze_frame_required: true },
      { dtc_code: 'P0AA6-00', service_id: '0x19', description: 'Hybrid Battery Voltage System Isolation Fault', freeze_frame_required: true },
      { dtc_code: 'U0100-87', service_id: '0x19', description: 'Lost Communication with ECM/VCU on Powertrain Bus', freeze_frame_required: false }
    ],
    risk_score: 95,
    confidence_score: 98,
    created_at: new Date('2026-03-20T08:00:00Z').toISOString(),
    status: 'Validated'
  },
  {
    id: 'REQ-ACC-104',
    title: 'Adaptive Cruise Control Radar Timeout and Smooth Deceleration Fallback',
    raw_text: `The ADAS Domain Controller shall track forward object velocity and range from the Long-Range Radar (LRR) via CAN_ADAS (CAN ID: 0x220, Cycle: 20ms).
If valid radar frames cease to arrive for greater than 100ms while ACC is actively controlling throttle/braking:
1. The ADAS Controller shall transition ACC state from ACTIVE to DEGRADED_COMMS_FALLBACK within 20ms.
2. The controller shall not command abrupt emergency braking; instead, it shall ramp down longitudinal deceleration at a controlled rate not exceeding -1.5 m/s² for 1.2 seconds, followed by gentle coasting.
3. The Driver Information System (IC / Cluster) shall be signaled via CAN ID 0x380 (Byte 2, Bit 4 = 1) to sound an acoustic warning chime (850 Hz) and display "ACC Disengaged - Sensor Comms Lost".
4. The system shall set DTC U0415-81 (Invalid Data Received from Anti-Lock Brake / Sensor Gateway) and inhibit ACC re-engagement until 50 consecutive valid radar frames with valid rolling counters and CRC are verified.`,
    ecu: 'ADAS_ECU (Advanced Driver Assistance)',
    asil_level: 'ASIL-B',
    category: 'Safety-Critical',
    inputs: [
      { name: 'Radar_Target_Data (0x220)', type: 'CAN Frame (20ms, Rolling Counter + CRC8)', interface_bus: 'CAN_ADAS (500 kbps)', description: 'Lead vehicle distance, relative speed, confidence' },
      { name: 'Vehicle_Speed_ESP (0x110)', type: 'CAN Frame (10ms)', interface_bus: 'CAN_Chassis', description: 'Wheel speed sensors averaged vehicle velocity' },
      { name: 'Brake_Pedal_Switch', type: 'hardwired discrete (dual redundant)', interface_bus: 'Hardwired 12V', description: 'Driver brake intervention override' }
    ],
    outputs: [
      { name: 'ACC_Torque_Request (0x140)', type: 'CAN Frame (10ms)', interface_bus: 'CAN_Powertrain', description: 'Deceleration and throttle torque demand' },
      { name: 'Cluster_ACC_Status (0x380)', type: 'CAN Frame (50ms)', interface_bus: 'CAN_Body', description: 'HMI visual and acoustic warning trigger' }
    ],
    triggers: [
      'CAN ID 0x220 missing for > 100ms (5 consecutive dropped frames)',
      'Radar Alive Counter stagnant for > 60ms',
      'CRC checksum mismatch on 3 consecutive frames'
    ],
    conditions: [
      'ACC is in ACTIVE state (Vehicle speed between 30 km/h and 160 km/h)',
      'No active driver brake pedal depression'
    ],
    timing_constraints: [
      { metric: 'Radar Loss Detection Time', max_latency_ms: 100, tolerance_ms: 5, notes: '5 lost frames at 20ms period' },
      { metric: 'Transition to Degraded Deceleration State', max_latency_ms: 20, tolerance_ms: 5, notes: 'From 100ms detection to torque ramp initiation' },
      { metric: 'Deceleration Ramp Duration', max_latency_ms: 1200, tolerance_ms: 100, notes: 'Controlled deceleration ramp-down profile' }
    ],
    interfaces: [
      'CAN_ADAS (CAN 2.0B 500 kbps, Autosar E2E Profile 1)',
      'CAN_Chassis (500 kbps)',
      'CAN_Powertrain (500 kbps)'
    ],
    dependencies: [
      'Electronic Stability Program (ESP) deceleration actuator',
      'Instrument Cluster HMI Audio Generator'
    ],
    failure_conditions: [
      'CAN Bus Off due to dominant bit error on ADAS bus',
      'Rolling counter freeze while radar data payload is static'
    ],
    safety_related_wording: [
      'ISO 26262 ASIL-B: Prevent unintended sudden high deceleration on public highways.',
      'Maximum deceleration rate capped at -1.5 m/s² during fallback.'
    ],
    diagnostic_implications: [
      { dtc_code: 'U0415-81', service_id: '0x19', description: 'Invalid Data Received from Radar Sensor Unit', freeze_frame_required: true },
      { dtc_code: 'U0115-00', service_id: '0x19', description: 'Lost Communication with Radar Sensor Module', freeze_frame_required: false }
    ],
    risk_score: 82,
    confidence_score: 95,
    created_at: new Date('2026-03-21T09:30:00Z').toISOString(),
    status: 'Validated'
  },
  {
    id: 'REQ-EPB-088',
    title: 'Electronic Parking Brake Dynamic Incline Plausibility and Secondary Hydraulic Clamp',
    raw_text: `The Electronic Parking Brake (EPB) Electronic Control Unit shall evaluate road gradient from the internal 3-axis accelerometer and external Inertial Measurement Unit (IMU) received over CAN_Chassis (CAN ID: 0x315) prior to clamping brake calipers.
When parking brake actuation is requested via switch at zero vehicle speed:
1. If the measured gradient is >= 18% incline/decline, the EPB shall increase electromechanical motor clamping force from normal (16.5 kN) to steep-slope clamping (21.0 kN ± 0.5 kN) within 800ms.
2. If a sensor plausibility conflict exists between the internal accelerometer and external IMU exceeding 4.0 degrees for > 150ms:
   a. The EPB shall default to the maximum clamping force (21.0 kN).
   b. Request secondary hydraulic pressure assist from the Electronic Stability Control (ESC) unit via CAN ID 0x218 (Byte 1 = 0xAA, Target: 45 bar).
   c. Flash the yellow EPB warning lamp at 2 Hz on the cluster.
   d. Store DTC C1009-64 (Longitudinal Acceleration Sensor Plausibility Failure).`,
    ecu: 'EPB (Electronic Parking Brake)',
    asil_level: 'ASIL-C',
    category: 'Safety-Critical',
    inputs: [
      { name: 'Internal_3Axis_Accel', type: 'SPI sensor data', interface_bus: 'Internal SPI Bus', description: 'On-board MEMS accelerometer' },
      { name: 'IMU_Chassis_Tilt (0x315)', type: 'CAN Frame (10ms)', interface_bus: 'CAN_Chassis', description: 'Yaw/Pitch/Roll rate sensor from central vehicle IMU' },
      { name: 'EPB_Console_Switch', type: 'dual redundant switch (Pull/Push)', interface_bus: 'Hardwired dual discrete', description: 'Cabin driver EPB lever' },
      { name: 'Wheel_Speed_Zero_Flag', type: 'boolean', interface_bus: 'CAN_Chassis (0x120)', description: 'Confirmed standstill detection from ESC' }
    ],
    outputs: [
      { name: 'Left_Caliper_Motor_H_Bridge', type: 'PWM Current (up to 25A)', interface_bus: 'Hardwired High-Current', description: 'Rear left disc brake actuator spindle motor' },
      { name: 'Right_Caliper_Motor_H_Bridge', type: 'PWM Current (up to 25A)', interface_bus: 'Hardwired High-Current', description: 'Rear right disc brake actuator spindle motor' },
      { name: 'ESC_Hydraulic_Assist_Req (0x218)', type: 'CAN Frame (10ms)', interface_bus: 'CAN_Chassis', description: 'Command to ESC for hydraulic pre-tension' }
    ],
    triggers: [
      'Driver pulls EPB switch while vehicle speed == 0 km/h',
      'Auto-hold timeout (> 3 minutes at standstill)',
      'Driver door open while seatbelt unbuckled on grade'
    ],
    conditions: [
      'Supply voltage between 9.0V and 16.0V DC',
      'No active motor thermal lockout (> 140°C H-bridge FET temperature)'
    ],
    timing_constraints: [
      { metric: 'Clamping Force Build Time', max_latency_ms: 800, tolerance_ms: 50, notes: 'Reach full 21.0 kN clamp force' },
      { metric: 'Sensor Plausibility Discrepancy Debounce', max_latency_ms: 150, tolerance_ms: 10, notes: 'Debounce filter before fallback trigger' },
      { metric: 'ESC Hydraulic Assist Latency', max_latency_ms: 40, tolerance_ms: 5, notes: 'CAN request sent to ESC' }
    ],
    interfaces: [
      'CAN_Chassis (500 kbps)',
      'High-Power H-Bridge Caliper Actuator Harness',
      'Hardwired Dual-Channel Microswitch'
    ],
    dependencies: [
      'ESC Hydraulic Pump availability for secondary clamping',
      '12V battery stability under 50A transient inrush load'
    ],
    failure_conditions: [
      'Actuator harness disconnected / open circuit',
      'H-bridge FET shorted to ground',
      'IMU CAN frame timeout'
    ],
    safety_related_wording: [
      'ISO 26262 ASIL-C: Prevent roll-away on 20% incline when parked.',
      'Mechanical hold must remain locked even upon total loss of 12V power.'
    ],
    diagnostic_implications: [
      { dtc_code: 'C1009-64', service_id: '0x19', description: 'Longitudinal Acceleration Sensor - Plausibility Failure', freeze_frame_required: true },
      { dtc_code: 'C1015-13', service_id: '0x19', description: 'Left Actuator Circuit Open / Disconnected', freeze_frame_required: true }
    ],
    risk_score: 88,
    confidence_score: 96,
    created_at: new Date('2026-03-22T11:15:00Z').toISOString(),
    status: 'Validated'
  },
  {
    id: 'REQ-TCU-205',
    title: 'Telematics Gateway Secure Over-The-Air (OTA) Firmware Flashing and Anti-Rollback',
    raw_text: `The Telematics Control Unit (TCU) acting as Central Security Gateway shall orchestrate over-the-air firmware updates for sub-ECUs over ISO 14229 UDS on DoIP / CAN-FD.
Prior to transferring payload flash blocks (UDS Service 0x36 TransferData):
1. The TCU shall verify the cryptographic signature of the flash container using an asymmetric ECDSA P-256 / SHA-256 algorithm backed by the Hardware Security Module (HSM).
2. The TCU shall check the firmware Monotonic Software Version against the internal anti-rollback counter stored in secure eFUSE memory. If the inbound payload version is less than the current eFUSE counter, the update shall be REJECTED immediately with Negative Response Code (NRC) 0x31 (Request Out of Range) and an incident logged to the vehicle Security Event Log.
3. If CAN bus utilization exceeds 85% during transmission, the TCU shall dynamically throttle inter-frame spacing from 2ms to 8ms to prevent bus starvation of safety-critical powertrain messages.
4. If communication is lost for > 5.0 seconds during active flashing, the target ECU shall retain its existing operational A-bank image and abort the staging B-bank partition without bricking.`,
    ecu: 'TCU (Telematics Gateway)',
    asil_level: 'ASIL-B',
    category: 'Cybersecurity',
    inputs: [
      { name: 'Inbound_OTA_Package', type: 'Encrypted binary container', interface_bus: '4G/5G Cellular / Ethernet DoIP', description: 'Signed binary update payload from OEM cloud server' },
      { name: 'Hardware_Root_of_Trust_Key', type: 'Public Key in HSM', interface_bus: 'Internal HSM Bus', description: 'OEM root certificate for firmware verification' },
      { name: 'Bus_Load_Telemetry', type: 'percentage (0-100%)', interface_bus: 'CAN Controller hardware registers', description: 'Real-time bus arbitration load' }
    ],
    outputs: [
      { name: 'UDS_Diagnostic_Stream', type: 'ISO 14229 / ISO 15765-2 DoCAN', interface_bus: 'CAN-FD Gateway / DoIP', description: 'Flashing sequence commands (0x34, 0x36, 0x37)' },
      { name: 'Security_Event_Alert', type: 'Syslog / SIEM format', interface_bus: 'Cloud Telemetry Stream', description: 'Tamper attempt or rollback attack telemetry' }
    ],
    triggers: [
      'OEM Cloud pushes authenticated campaign update command',
      'Vehicle stationary in PARK with SOC > 60% and 12V battery > 12.6V'
    ],
    conditions: [
      'Vehicle is in SAFE_STATIONARY state (Speed == 0, Gear == PARK)',
      'Hazard warning lights operable'
    ],
    timing_constraints: [
      { metric: 'HSM Signature Verification Latency', max_latency_ms: 1500, tolerance_ms: 200, notes: 'Verify 256MB container SHA-256 + ECDSA' },
      { metric: 'Anti-Rollback Check Delay', max_latency_ms: 50, tolerance_ms: 5, notes: 'Read secure eFUSE counter' },
      { metric: 'Comms Lost Recovery Timeout', max_latency_ms: 5000, tolerance_ms: 500, notes: 'Fallback to Bank-A operational image' }
    ],
    interfaces: [
      'DoIP (ISO 13400-2 100BASE-T1 Ethernet)',
      'CAN-FD Powertrain / Gateway (2 Mbps data phase)',
      'Hardware Security Module (HSM SHE / EVITA Full)'
    ],
    dependencies: [
      'Dual-bank A/B flash partitions on recipient ECUs',
      '12V battery charger or battery stability guarantee'
    ],
    failure_conditions: [
      'Cellular signal drop during binary transfer',
      'Corrupted cryptographic signature bit flip',
      'Power supply interruption during block erase'
    ],
    safety_related_wording: [
      'ISO 21434 Road Vehicles Cybersecurity Engineering compliance.',
      'UN R156 Software Update Management System (SUMS) anti-tampering mandate.',
      'Safe state: Retain prior fully validated firmware image.'
    ],
    diagnostic_implications: [
      { dtc_code: 'U3000-45', service_id: '0x19', description: 'Electronic Control Unit - Program Memory Checksum Failure', freeze_frame_required: true },
      { dtc_code: 'U059B-00', service_id: '0x19', description: 'Invalid Security Credential / Anti-Rollback Violation', freeze_frame_required: true }
    ],
    risk_score: 91,
    confidence_score: 94,
    created_at: new Date('2026-03-22T14:40:00Z').toISOString(),
    status: 'Validated'
  },
  {
    id: 'REQ-VCU-077',
    title: 'Dual-Pedal Conflict Detection and Regenerative Braking Torque Cutoff',
    raw_text: `The Vehicle Control Unit (VCU) shall continuously compare Accelerator Pedal Position Sensor 1 (APPS1) and Sensor 2 (APPS2) against Service Brake Pressure via CAN_Powertrain (CAN ID: 0x180 and 0x240).
If the driver simultaneously presses the service brake pedal (> 15 bar hydraulic line pressure) while accelerator pedal depression is >= 20% for longer than 80ms:
1. The VCU shall declare a Plausibility Dual-Pedal Conflict.
2. The VCU shall immediately override accelerator input and ramp down drive torque demand to 0 Nm at a maximum rate of 150 Nm/100ms.
3. Inverter regenerative braking shall be disabled immediately (< 25ms) to prevent rear-wheel lockup or ABS interference during emergency braking.
4. The instrument cluster shall illuminate the brake override indicator.
5. Normal throttle response shall be restored only when accelerator pedal is released below 5% and brake pressure drops below 5 bar for > 200ms.`,
    ecu: 'VCU (Vehicle Control Unit)',
    asil_level: 'ASIL-D',
    category: 'Safety-Critical',
    inputs: [
      { name: 'APPS_Sensor_1', type: 'Analog voltage (0.5V - 4.5V)', interface_bus: 'Hardwired 12-bit ADC', description: 'Pedal position track 1' },
      { name: 'APPS_Sensor_2', type: 'Analog voltage (0.25V - 2.25V)', interface_bus: 'Hardwired 12-bit ADC', description: 'Pedal position track 2 (1:2 ratio)' },
      { name: 'Brake_Pressure_Hydraulic', type: 'float (bar)', interface_bus: 'CAN_Chassis (0x190)', description: 'Master cylinder hydraulic pressure transducer' }
    ],
    outputs: [
      { name: 'Inverter_Torque_Command (0x120)', type: 'CAN Frame (5ms)', interface_bus: 'CAN_Powertrain', description: 'Target torque command in Nm' },
      { name: 'Regen_Inhibit_Discrete', type: 'digital flag', interface_bus: 'CAN_Powertrain', description: 'Disable active regenerative motor braking' }
    ],
    triggers: [
      'Brake pressure > 15 bar AND APPS >= 20% for > 80ms',
      'APPS1 vs APPS2 divergence > 10% for > 50ms'
    ],
    conditions: [
      'Vehicle in DRIVE or REVERSE motion'
    ],
    timing_constraints: [
      { metric: 'Dual Pedal Conflict Detection Delay', max_latency_ms: 80, tolerance_ms: 5, notes: 'Debounce window' },
      { metric: 'Regen Torque Cutoff Latency', max_latency_ms: 25, tolerance_ms: 5, notes: 'Prevent rear-axle destabilization' },
      { metric: 'Drive Torque Ramp-down Latency', max_latency_ms: 100, tolerance_ms: 10, notes: 'Ramp down to 0 Nm' }
    ],
    interfaces: [
      'CAN_Powertrain (500 kbps, Autosar E2E)',
      'Dual Redundant Analog ADC inputs with pull-down resistors'
    ],
    dependencies: [
      'Inverter Motor Controller torque command execution speed'
    ],
    failure_conditions: [
      'Pedal sensor ground loss (causes float to 5V)',
      'Brake line pressure sensor stuck at 0 bar'
    ],
    safety_related_wording: [
      'ISO 26262 ASIL-D: Avoid unintended acceleration under conflicting pedal inputs.',
      'FMVSS 124 Accelerator Control Systems mandate compliance.'
    ],
    diagnostic_implications: [
      { dtc_code: 'P2138-00', service_id: '0x19', description: 'Throttle/Pedal Position Sensor/Switch D/E Voltage Correlation', freeze_frame_required: true },
      { dtc_code: 'P0571-00', service_id: '0x19', description: 'Brake Switch A Circuit Plausibility', freeze_frame_required: false }
    ],
    risk_score: 96,
    confidence_score: 97,
    created_at: new Date('2026-03-23T10:00:00Z').toISOString(),
    status: 'Validated'
  }
];
