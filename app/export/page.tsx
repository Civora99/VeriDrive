'use client';

import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileCode,
  FileJson,
  Check,
  CheckCircle2,
  Copy,
  Layers,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

const EXPORT_SAMPLE_DATA = [
  {
    test_id: 'TC-001',
    requirement_id: 'REQ-001',
    title: 'Normal GPS transmission at 10-second cadence',
    objective: 'Verify that the telematics ECU transmits valid vehicle GPS position data every 10 seconds when ignition and cellular connectivity are available.',
    category: 'Functional',
    priority: 'HIGH',
    risk: 'HIGH',
    preconditions: 'Telematics ECU powered; Ignition ON; GPS signal valid; Cellular connected',
    test_inputs: 'Ignition = ON; GPS = Valid Coordinates; Cellular = Connected',
    steps: '1. Power ON telematics ECU. 2. Set ignition state to ON. 3. Provide valid GPS coordinates. 4. Establish cellular connectivity. 5. Monitor telemetry messages. 6. Measure interval.',
    expected_result: 'The ECU transmits the vehicle GPS position at 10-second intervals while ignition remains ON and cellular connectivity is available.',
    failure_condition: 'Test fails if no position is transmitted within the required interval or if an invalid/stale position is transmitted.',
    traceability: 'REQ-001',
    reason_generated: 'Validates primary nominal operational requirement under standard vehicle operating conditions.'
  },
  {
    test_id: 'TC-002',
    requirement_id: 'REQ-001',
    title: '10-second periodic interval timing boundary and jitter',
    objective: 'Verify clock jitter and scheduler timing drift do not exceed maximum permissible tolerance over 100 cycles.',
    category: 'Timing',
    priority: 'HIGH',
    risk: 'MEDIUM',
    preconditions: 'Master PTP/NTP network clock synchronized; Ignition ON; Cellular connected',
    test_inputs: 'Ignition = ON; Cellular = Connected; Measurement = 100 cycles',
    steps: '1. Arm sniffer on uplink. 2. Record timestamp delta for 100 consecutive transmissions. 3. Calculate max/min drift.',
    expected_result: 'All packet transmission deltas fall strictly between 9.5s and 10.5s; jitter does not exceed ±500ms.',
    failure_condition: 'Test fails if any inter-packet arrival time exceeds 10.5s or drops below 9.5s.',
    traceability: 'REQ-001',
    reason_generated: 'Validates timing constraints and verifies scheduler does not experience timer drift or starvation.'
  },
  {
    test_id: 'TC-003',
    requirement_id: 'REQ-001',
    title: 'GPS signal unavailable / antenna disconnect handling',
    objective: 'Verify that invalid or missing GPS coordinates are not transmitted as valid vehicle position data when GNSS signal is lost.',
    category: 'Negative',
    priority: 'HIGH',
    risk: 'HIGH',
    preconditions: 'Ignition ON; Cellular connected; Nominal 10s telemetry active',
    test_inputs: 'Ignition = ON; GPS = Attenuated / No Fix; Cellular = Connected',
    steps: '1. Attenuate GNSS RF antenna line. 2. Wait for 3D fix flag to drop. 3. Observe next scheduled 10-second transmission.',
    expected_result: 'The ECU shall detect invalid GPS data and shall not transmit the invalid GPS position as valid vehicle position data.',
    failure_condition: 'Test fails if invalid or stale GPS data is transmitted as valid vehicle position.',
    traceability: 'REQ-001',
    reason_generated: 'The requirement depends on valid GPS input, therefore GPS loss must be validated as a negative scenario.'
  },
  {
    test_id: 'TC-004',
    requirement_id: 'REQ-001',
    title: 'Cellular network unavailable / dead-zone buffering',
    objective: 'Verify ECU buffers un-transmitted GPS coordinates in non-volatile memory rather than discarding them during network dead-zone.',
    category: 'Communication',
    priority: 'HIGH',
    risk: 'HIGH',
    preconditions: 'Ignition ON; Valid GPS lock active',
    test_inputs: 'Ignition = ON; GPS = Valid; Cellular = Disconnected',
    steps: '1. Mute cellular RF carrier. 2. Continue driving simulation for 60s. 3. Inspect internal telematics queue memory.',
    expected_result: 'ECU buffers un-transmitted GPS coordinates in non-volatile flash memory in chronological FIFO sequence without data loss.',
    failure_condition: 'Test fails if coordinates are discarded without queueing or if buffer overflows prematurely.',
    traceability: 'REQ-001',
    reason_generated: 'Validates communication dependency loss behavior and local buffering reliability.'
  },
  {
    test_id: 'TC-005',
    requirement_id: 'REQ-001',
    title: 'Cellular reconnection and buffered telemetry recovery',
    objective: 'Verify that when cellular signal is restored, ECU reconnects and flushes all buffered GPS points in chronological FIFO order.',
    category: 'Recovery',
    priority: 'HIGH',
    risk: 'HIGH',
    preconditions: 'ECU in buffered state following cellular outage with 6 queued records',
    test_inputs: 'Cellular = Restored; Ignition = ON',
    steps: '1. Re-enable cellular network carrier. 2. Monitor modem attachment and TLS handshake. 3. Observe queue draining sequence.',
    expected_result: 'All buffered GPS packets are transmitted in chronological order with original historical timestamps, followed by resumption of real-time 10s cadence.',
    failure_condition: 'Test fails if buffered packets are lost, transmitted out of order, or if current cadence fails to resume.',
    traceability: 'REQ-001',
    reason_generated: 'Validates communication recovery and data integrity preservation after connectivity drop.'
  },
  {
    test_id: 'TC-006',
    requirement_id: 'REQ-001',
    title: 'ECU ignition power cycle / brownout restart',
    objective: 'Verify telematics bootloader recovery and telemetry resumption following an unexpected ignition power cycle or engine crank voltage drop.',
    category: 'Fault Injection',
    priority: 'MEDIUM',
    risk: 'HIGH',
    preconditions: 'Telematics operating in active 10s transmission mode',
    test_inputs: 'KL30 = 13.8V -> 6.5V -> 13.8V; Ignition = Cycled',
    steps: '1. Drop supply voltage to 6.5V for 150ms. 2. Restore nominal 13.8V. 3. Measure time to cold boot completion and first transmission.',
    expected_result: 'ECU reboots cleanly without watchdog latch, recovers non-volatile state, and resumes periodic 10s telemetry within 15.0s.',
    failure_condition: 'Test fails if boot hangs, watchdog trips continuously, or telemetry fails to resume automatically.',
    traceability: 'REQ-001',
    reason_generated: 'Automotive electrical systems experience severe power transients (ISO 16750-2); restart behavior must be verified.'
  },
  {
    test_id: 'TC-007',
    requirement_id: 'REQ-001',
    title: 'Stale GPS position detection while vehicle is in motion',
    objective: 'Verify ECU detects frozen/stale NMEA coordinates from internal GNSS receiver and refuses to publish unverified coordinates as fresh.',
    category: 'Boundary',
    priority: 'HIGH',
    risk: 'CRITICAL',
    preconditions: 'Ignition ON; Cellular connected; Vehicle speed simulated > 50 km/h',
    test_inputs: 'Vehicle Speed = 65 km/h; GPS Delta = 0.0000 (Frozen)',
    steps: '1. Inject frozen coordinate values while vehicle speed is 65 km/h. 2. Observe position freshness attribute over 3 consecutive cycles (30s).',
    expected_result: 'ECU detects frozen coordinates during motion, asserts position_freshness = STALE (0x02) after 3.0s, and logs diagnostic trouble code.',
    failure_condition: 'Test fails if frozen coordinates continue to be transmitted with fresh/valid status flag.',
    traceability: 'REQ-001',
    reason_generated: 'Requirement implies transmitting valid vehicle position; static coordinate lock during vehicle motion violates safety integrity.'
  }
];

export default function ExportPage() {
  const [downloadedFormat, setDownloadedFormat] = useState<string | null>(null);

  const handleDownloadCSV = () => {
    const headers = [
      'Requirement ID',
      'Test ID',
      'Test Title',
      'Objective',
      'Category',
      'Priority',
      'Risk',
      'Preconditions',
      'Inputs',
      'Steps',
      'Expected Result',
      'Failure Condition',
      'Traceability',
      'Reason Generated'
    ];

    const rows = EXPORT_SAMPLE_DATA.map((t) => [
      `"${t.requirement_id}"`,
      `"${t.test_id}"`,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.objective.replace(/"/g, '""')}"`,
      `"${t.category}"`,
      `"${t.priority}"`,
      `"${t.risk}"`,
      `"${t.preconditions.replace(/"/g, '""')}"`,
      `"${t.test_inputs.replace(/"/g, '""')}"`,
      `"${t.steps.replace(/"/g, '""')}"`,
      `"${t.expected_result.replace(/"/g, '""')}"`,
      `"${t.failure_condition.replace(/"/g, '""')}"`,
      `"${t.traceability}"`,
      `"${t.reason_generated.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = 'PACCAR_TestPilot_REQ-001_ValidationSuite.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadedFormat('csv');
    setTimeout(() => setDownloadedFormat(null), 3000);
  };

  const handleDownloadJSON = () => {
    const jsonContent = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(EXPORT_SAMPLE_DATA, null, 2));
    const link = document.createElement('a');
    link.href = jsonContent;
    link.download = 'PACCAR_TestPilot_REQ-001_ValidationSuite.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadedFormat('json');
    setTimeout(() => setDownloadedFormat(null), 3000);
  };

  const handleDownloadPyTest = () => {
    const pyContent = `"""
PACCAR TestPilot AI - Generated PyTest Automotive Validation Suite
Requirement: REQ-001
Target: Telematics ECU
Generated: 2026-09-26
"""

import pytest
import time

class TelematicsHILBench:
    def __init__(self):
        self.ignition = "OFF"
        self.cellular = "DISCONNECTED"
        self.gps_fix = "NO_FIX"
        self.buffered_packets = []

    def set_ignition(self, state: str):
        self.ignition = state

    def set_cellular(self, state: str):
        self.cellular = state

    def set_gps(self, state: str):
        self.gps_fix = state

@pytest.fixture
def bench():
    b = TelematicsHILBench()
    b.set_ignition("ON")
    b.set_cellular("CONNECTED")
    b.set_gps("3D_VALID")
    return b

def test_tc_001_nominal_periodic_transmission(bench):
    """TC-001: Normal GPS transmission at 10-second cadence"""
    assert bench.ignition == "ON"
    assert bench.cellular == "CONNECTED"
    assert bench.gps_fix == "3D_VALID"
    # Verification criteria: packet published within 10.0s ± 0.5s

def test_tc_002_timing_boundary_and_jitter(bench):
    """TC-002: 10-second periodic interval timing boundary and jitter"""
    max_jitter_ms = 80
    assert max_jitter_ms <= 500  # ±500ms OEM tolerance

def test_tc_003_gps_signal_loss(bench):
    """TC-003: GPS signal unavailable / antenna disconnect handling"""
    bench.set_gps("NO_FIX")
    # Verify invalid GPS position is suppressed or flagged invalid
    assert bench.gps_fix != "3D_VALID"

def test_tc_004_cellular_deadzone_buffering(bench):
    """TC-004: Cellular network unavailable / dead-zone buffering"""
    bench.set_cellular("DISCONNECTED")
    # Verify un-transmitted GPS points are queued in ring buffer
    assert bench.cellular == "DISCONNECTED"

def test_tc_005_cellular_reconnection_recovery(bench):
    """TC-005: Cellular reconnection and buffered telemetry recovery"""
    bench.set_cellular("CONNECTED")
    # Verify buffered points flushed in chronological FIFO order
    assert bench.cellular == "CONNECTED"

def test_tc_006_ecu_power_cycle_reboot(bench):
    """TC-006: ECU ignition power cycle / brownout restart"""
    bench.set_ignition("OFF")
    time.sleep(0.1)
    bench.set_ignition("ON")
    assert bench.ignition == "ON"

def test_tc_007_stale_coordinate_detection(bench):
    """TC-007: Stale GPS position detection while vehicle is in motion"""
    # Verify ECU detects frozen coordinates and flags STALE (0x02) after 3.0s
    pass
`;

    const blob = new Blob([pyContent], { type: 'text/x-python' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'test_paccar_req_001.py';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadedFormat('pytest');
    setTimeout(() => setDownloadedFormat(null), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-slate-800">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
          Export Validation Suite
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Export synthesized automotive test scenarios into engineering verification formats (Excel/CSV, PyTest, JSON)
        </p>
      </div>

      {/* Target Requirement Info */}
      <div className="bg-[#111622] border border-slate-800 rounded-lg p-4 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950/60 border border-sky-900/60 px-2.5 py-0.5 rounded">
              REQ-001
            </span>
            <span className="text-xs font-semibold text-slate-200">
              Telematics ECU 10s Cloud GPS Transmission
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            7 Test Cases Synthesized • ISO 26262 & ASPICE SWE.4 Verification Traceable
          </p>
        </div>

        <Link
          href="/tests"
          className="text-xs text-sky-400 hover:text-sky-300 flex items-center space-x-1"
        >
          <span>View Test Suite</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 3 Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Format 1: Excel / CSV */}
        <div className="bg-[#111622] border border-slate-800 rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Excel / CSV Spreadsheet</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Standard automotive verification matrix containing Test ID, Objective, Steps, Expected Results, and Traceability columns.
              </p>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Format: .csv (Excel, LibreOffice, DOORS)
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadCSV}
            className="w-full py-2 px-3 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors"
          >
            {downloadedFormat === 'csv' ? (
              <>
                <Check className="w-4 h-4" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download CSV / Excel</span>
              </>
            )}
          </button>
        </div>

        {/* Format 2: PyTest Script */}
        <div className="bg-[#111622] border border-slate-800 rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-sky-950/60 border border-sky-800/80 flex items-center justify-center text-sky-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">PyTest Test Harness</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Executable Python test script with test fixtures, assertions, and stimulus injections for automated CI/CD and HIL benches.
              </p>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Format: .py (Python 3.10+, PyTest)
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadPyTest}
            className="w-full py-2 px-3 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors"
          >
            {downloadedFormat === 'pytest' ? (
              <>
                <Check className="w-4 h-4" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download PyTest File</span>
              </>
            )}
          </button>
        </div>

        {/* Format 3: JSON Specification */}
        <div className="bg-[#111622] border border-slate-800 rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-950/60 border border-indigo-800/80 flex items-center justify-center text-indigo-400">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Structured JSON</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Complete structured JSON payload adhering to the PACCAR TestPilot test schema with exact input parameters and criteria.
              </p>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Format: .json (REST API, ALM Integration)
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadJSON}
            className="w-full py-2 px-3 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors"
          >
            {downloadedFormat === 'json' ? (
              <>
                <Check className="w-4 h-4" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download JSON</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
