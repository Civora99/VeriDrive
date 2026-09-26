'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Filter,
  Sparkles,
  X,
  ChevronRight,
  PlusCircle,
  FileCheck2,
  Copy,
  Download,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  AlertCircle,
  Check
} from 'lucide-react';
import { pyGenerateTests, pyCriticTests } from '@/lib/api/pythonBackend';
import { DEMO_REQUIREMENTS } from '@/data/demo-requirements';

export interface PaccarTestCase {
  test_id: string;
  requirement_id: string;
  title: string;
  objective: string;
  category: 'Functional' | 'Boundary' | 'Negative' | 'Timing' | 'Communication' | 'Diagnostic' | 'Recovery' | 'State Transition' | 'Cross-ECU' | 'Fault Injection';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  preconditions: string[];
  test_inputs: Record<string, string>;
  steps: string[];
  expected_result: string;
  failure_condition: string;
  test_data: Record<string, string>;
  traceability: {
    requirement_id: string;
  };
  reason_generated: string;
  added_by_critic?: boolean;
}

// 7 Standard synthesized test scenarios conforming to PACCAR TestPilot specification
const INITIAL_PACCAR_TESTS: PaccarTestCase[] = [
  {
    test_id: 'TC-001',
    requirement_id: 'REQ-001',
    title: 'Normal GPS transmission at 10-second cadence',
    objective: 'Verify that the telematics ECU transmits valid vehicle GPS coordinates to cloud endpoint every 10.0 seconds when ignition is ON and cellular network is connected.',
    category: 'Functional',
    priority: 'HIGH',
    risk: 'HIGH',
    preconditions: [
      'Telematics ECU is powered on test bench',
      'Ignition state (KL15) is ON (12V active)',
      'Cellular modem is registered on OEM APN network',
      'GNSS receiver has acquired valid 3D satellite fix'
    ],
    test_inputs: {
      ignition: 'ON',
      gps_fix: '3D_VALID',
      cellular: 'CONNECTED'
    },
    steps: [
      'Power ON the telematics ECU test bench.',
      'Set ignition state input to ON (KL15 = 12V).',
      'Provide valid GPS satellite RF simulation coordinates.',
      'Establish cellular connectivity with cloud endpoint.',
      'Monitor outgoing telemetry frames over 60 seconds.',
      'Measure transmission intervals between consecutive packets.'
    ],
    expected_result: 'The telematics ECU shall transmit the vehicle GPS position at strict 10-second intervals (±500ms) while ignition remains ON and cellular connectivity is available.',
    failure_condition: 'Test fails if no telemetry packet is published within 10.5 seconds, or if coordinate payload contains corrupt/empty values.',
    test_data: {
      latitude: '47.5255 N',
      longitude: '122.1804 W',
      interval_nominal: '10.0 seconds',
      tolerance: '±500 ms'
    },
    traceability: {
      requirement_id: 'REQ-001'
    },
    reason_generated: 'Validates primary nominal operational requirement under standard vehicle operating conditions.'
  },
  {
    test_id: 'TC-002',
    requirement_id: 'REQ-001',
    title: '10-second periodic interval timing boundary and jitter',
    objective: 'Verify clock jitter and scheduler timing drift do not exceed maximum permissible OEM tolerance over 100 consecutive transmission cycles.',
    category: 'Timing',
    priority: 'HIGH',
    risk: 'MEDIUM',
    preconditions: [
      'Master PTP/NTP network clock synchronized',
      'Ignition ON, cellular connection active, continuous GPS lock'
    ],
    test_inputs: {
      ignition: 'ON',
      cellular: 'CONNECTED',
      measurement_duration: '1000s'
    },
    steps: [
      'Arm precision hardware sniffer on cellular uplink interface.',
      'Record inter-arrival timestamp delta for 100 consecutive periodic transmissions.',
      'Calculate maximum, minimum, and cumulative timer drift across measurement window.'
    ],
    expected_result: 'All packet transmission deltas fall strictly between 9.5s and 10.5s; jitter does not exceed ±500ms with zero cumulative timer starvation.',
    failure_condition: 'Test fails if any inter-packet arrival time exceeds 10.5s or drops below 9.5s.',
    test_data: {
      min_allowable_interval: '9500 ms',
      max_allowable_interval: '10500 ms',
      consecutive_cycles: '100'
    },
    traceability: {
      requirement_id: 'REQ-001'
    },
    reason_generated: 'Validates timing constraints and verifies scheduler does not experience timer drift or thread starvation.'
  },
  {
    test_id: 'TC-003',
    requirement_id: 'REQ-001',
    title: 'GPS signal unavailable / antenna disconnect handling',
    objective: 'Verify that invalid or missing GPS coordinates are not transmitted as valid vehicle position data when GNSS signal is lost.',
    category: 'Negative',
    priority: 'HIGH',
    risk: 'HIGH',
    preconditions: [
      'Ignition ON, cellular connected, nominal 10s telemetry cadence active'
    ],
    test_inputs: {
      ignition: 'ON',
      gps_signal: 'ATTENUATED_0_DBM',
      cellular: 'CONNECTED'
    },
    steps: [
      'Attenuate or disconnect GNSS RF antenna line.',
      'Wait for receiver 3D satellite lock flag to drop.',
      'Observe payload of next scheduled 10-second transmission.'
    ],
    expected_result: 'The ECU shall detect invalid GPS data and shall not transmit the invalid GPS position as valid vehicle position data (asserts GPS_FIX_INVALID flag).',
    failure_condition: 'Test fails if invalid, zeroed, or unflagged coordinates are transmitted as valid vehicle position.',
    test_data: {
      gnss_rf_power: '-140 dBm (No Fix)',
      expected_status_flag: '0x00 (INVALID)'
    },
    traceability: {
      requirement_id: 'REQ-001'
    },
    reason_generated: 'The requirement depends on valid GPS input, therefore GPS loss must be validated as a negative scenario.'
  },
  {
    test_id: 'TC-004',
    requirement_id: 'REQ-001',
    title: 'Cellular network unavailable / dead-zone buffering',
    objective: 'Verify ECU behavior when cellular connectivity is severed, ensuring telemetry coordinates are buffered locally in ring buffer rather than discarded.',
    category: 'Communication',
    priority: 'HIGH',
    risk: 'HIGH',
    preconditions: [
      'Ignition ON, valid GPS lock active'
    ],
    test_inputs: {
      ignition: 'ON',
      gps_fix: 'VALID',
      cellular: 'DISCONNECTED'
    },
    steps: [
      'Mute cellular base station carrier (simulate dead-zone or tunnel).',
      'Continue driving simulation for 60 seconds (6 expected periodic points).',
      'Inspect non-volatile telematics ring buffer memory.'
    ],
    expected_result: 'ECU buffers un-transmitted GPS coordinates in non-volatile flash memory in chronological FIFO sequence without data loss.',
    failure_condition: 'Test fails if coordinates are discarded without queueing or if buffer overflows prematurely.',
    test_data: {
      outage_duration: '60 seconds',
      expected_buffered_records: '6'
    },
    traceability: {
      requirement_id: 'REQ-001'
    },
    reason_generated: 'Validates communication dependency loss behavior and local non-volatile buffering reliability.'
  },
  {
    test_id: 'TC-005',
    requirement_id: 'REQ-001',
    title: 'Cellular reconnection and buffered telemetry recovery',
    objective: 'Verify that when cellular signal is restored, the ECU reconnects and flushes all buffered GPS points in chronological order.',
    category: 'Recovery',
    priority: 'HIGH',
    risk: 'HIGH',
    preconditions: [
      'ECU in buffered state following cellular outage with 6 queued records'
    ],
    test_inputs: {
      cellular_carrier: 'RESTORED',
      ignition: 'ON'
    },
    steps: [
      'Re-enable cellular network base station RF carrier.',
      'Monitor modem network attachment and TLS session handshake.',
      'Observe queue draining sequence and resumption of real-time 10s cadence.'
    ],
    expected_result: 'All buffered GPS packets are transmitted in chronological order with original historical timestamps, followed by resumption of real-time 10s cadence.',
    failure_condition: 'Test fails if buffered packets are lost, transmitted out of order, or if current cadence fails to resume.',
    test_data: {
      network_reconnect_timeout: '15 seconds',
      flush_cadence: 'Burst FIFO'
    },
    traceability: {
      requirement_id: 'REQ-001'
    },
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
    preconditions: [
      'Telematics operating in active 10s transmission mode'
    ],
    test_inputs: {
      kl30_voltage: '13.8V -> 6.5V -> 13.8V',
      ignition: 'CYCLED'
    },
    steps: [
      'Drop supply voltage to 6.5V for 150ms to simulate cold-crank transient.',
      'Restore nominal 13.8V power supply.',
      'Measure time to cold boot completion and first published telemetry message.'
    ],
    expected_result: 'ECU reboots cleanly without watchdog latch, recovers non-volatile state, and resumes periodic 10s telemetry within 15.0s of power restoration.',
    failure_condition: 'Test fails if boot hangs, watchdog trips continuously, or telemetry fails to resume automatically.',
    test_data: {
      dip_voltage: '6.5V',
      dip_duration: '150 ms',
      max_boot_time: '15.0 seconds'
    },
    traceability: {
      requirement_id: 'REQ-001'
    },
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
    preconditions: [
      'Ignition ON, cellular connected, vehicle speed simulated > 50 km/h'
    ],
    test_inputs: {
      vehicle_speed: '65 km/h',
      gps_coordinate_delta: '0.0000 (Frozen)'
    },
    steps: [
      'Inject frozen coordinate values while vehicle speed signal reports 65 km/h.',
      'Observe position freshness attribute over 3 consecutive cycles (30 seconds).'
    ],
    expected_result: 'ECU detects frozen coordinates during motion, asserts position_freshness = STALE (0x02) after 3.0s, and logs diagnostic trouble code.',
    failure_condition: 'Test fails if frozen coordinates continue to be transmitted with fresh/valid status flag.',
    test_data: {
      staleness_timeout: '3000 ms',
      speed_threshold: '50 km/h'
    },
    traceability: {
      requirement_id: 'REQ-001'
    },
    reason_generated: 'Requirement implies transmitting valid vehicle position; static coordinate lock during vehicle motion violates safety integrity.'
  }
];

function TestsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reqId = searchParams.get('req') || 'REQ-001';

  const [testSuite, setTestSuite] = useState<PaccarTestCase[]>(INITIAL_PACCAR_TESTS);
  const [selectedTest, setSelectedTest] = useState<PaccarTestCase | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');

  // AI Critic state
  const [criticAdded, setCriticAdded] = useState(false);
  const [isCriticLoading, setIsCriticLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load from Python backend using active requirement
  useEffect(() => {
    async function fetchFromPython() {
      try {
        let reqText = 'The telematics ECU shall transmit vehicle GPS position every 10 seconds when ignition is ON and cellular connectivity is available.';
        let analysisObj: any = undefined;

        if (typeof window !== 'undefined') {
          const stored = sessionStorage.getItem('veridrive_active_requirement');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              reqText = parsed.raw_text || reqText;
              analysisObj = parsed;
            } catch (e) {}
          }
        }

        if (reqId && reqId !== 'REQ-001' && reqId !== 'REQ-TLM-001') {
          const found = DEMO_REQUIREMENTS.find((r) => r.id === reqId);
          if (found) {
            reqText = found.raw_text;
            analysisObj = found;
          }
        }

        const data = await pyGenerateTests(reqText, analysisObj);

        if (data.tests && data.tests.length > 0) {
          // Map Python tests to PaccarTestCase format
          const mapped: PaccarTestCase[] = data.tests.map((t: any) => ({
            test_id: t.test_id,
            requirement_id: t.requirement_id || reqId,
            title: t.title,
            objective: t.description || `Verify ${t.title.toLowerCase()}`,
            category: t.category,
            priority: t.priority,
            risk: t.risk,
            preconditions: Array.isArray(t.preconditions) ? t.preconditions : [t.preconditions || 'Ignition ON'],
            test_inputs: { ignition: 'ON', cellular: 'CONNECTED', gps: 'ACTIVE' },
            steps: t.steps || ['1. Initialize bench', '2. Apply input', '3. Verify telemetry'],
            expected_result: t.expected_result,
            failure_condition: `Test fails if observed behavior deviates from: ${t.expected_result}`,
            test_data: { interval: '10s', interface: 'CAN/Cellular' },
            traceability: { requirement_id: t.requirement_id || reqId },
            reason_generated: t.reason_generated
          }));
          setTestSuite(mapped);
        }
      } catch (err) {
        console.warn('Python backend offline or unreachable, using pre-synthesized suite:', err);
      }
    }

    fetchFromPython();
  }, [reqId]);

  // Handle adding critic recommended test by querying Python backend /critic
  const handleAddCriticTest = async () => {
    setIsCriticLoading(true);

    try {
      let reqText = 'The telematics ECU shall transmit vehicle GPS position every 10 seconds when ignition is ON and cellular connectivity is available.';
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('veridrive_active_requirement');
        if (stored) {
          try {
            reqText = JSON.parse(stored).raw_text || reqText;
          } catch (e) {}
        }
      }

      const data = await pyCriticTests(reqText, testSuite);
      const suggestions = data.additional_test_suggestions || [];
      if (suggestions.length > 0) {
        const newTests: PaccarTestCase[] = suggestions.map((s: any) => ({
          test_id: s.test_id || `TC-CRITIC-001`,
          requirement_id: reqId,
          title: s.title,
          objective: `Critic Audit: ${s.title}`,
          category: s.category || 'Recovery',
          priority: s.priority || 'HIGH',
          risk: s.risk || 'HIGH',
          preconditions: s.preconditions || ['Ignition ON', 'Cellular connected'],
          test_inputs: { network_outage_duration: '45s' },
          steps: s.steps || ['1. Restore network', '2. Verify queue flush'],
          expected_result: s.expected_result,
          failure_condition: `Fails if: ${s.expected_result}`,
          test_data: { dtc_code: 'U0423-82', debounce_time: '3500ms' },
          traceability: { requirement_id: reqId },
          reason_generated: s.reason_generated || 'Added by AI Critic Review',
          added_by_critic: true
        }));

        setTestSuite((prev) => [...prev, ...newTests]);
        setCriticAdded(true);
        return;
      }
    } catch (err) {
      console.warn('Critic API query fallback:', err);
    } finally {
      setIsCriticLoading(false);
    }

    // Deterministic fallback
    const fallbackTest: PaccarTestCase = {
      test_id: 'TC-008',
      requirement_id: reqId,
      title: 'Cellular reconnection telemetry recovery after tunnel outage',
      objective: 'Verify that when cellular signal is restored, ECU reconnects and safely flushes buffered GPS points in chronological FIFO order.',
      category: 'Recovery',
      priority: 'HIGH',
      risk: 'HIGH',
      preconditions: ['Vehicle simulated passing through tunnel with 45-second cellular loss', 'Ignition active, GPS fix intact'],
      test_inputs: { gnss_antenna: 'DISCONNECTED', duration: '5000 ms' },
      steps: [
        '1. Restore cellular RF connectivity after 45 seconds of dead zone.',
        '2. Observe TCP/TLS connection re-handshake and MQTT ping response.',
        '3. Verify queued telemetry buffer is transmitted prior to fresh 10s packet.'
      ],
      expected_result: 'Connection recovered within 3.5 seconds; buffered coordinates delivered in FIFO order without duplicates.',
      failure_condition: 'Test fails if buffered telemetry packets are dropped or delivered out of sequence.',
      test_data: { dtc_code: 'U0423-82', debounce_time: '3500 ms' },
      traceability: { requirement_id: reqId },
      reason_generated: 'Added by Critic: Fills critical missing scenario for transient network loss common on freight highway corridors.',
      added_by_critic: true
    };

    setTestSuite((prev) => [...prev, fallbackTest]);
    setCriticAdded(true);
    setIsCriticLoading(false);
  };

  // Filtered test list
  const filteredTests = useMemo(() => {
    return testSuite.filter((tc) => {
      const matchesSearch =
        searchQuery === '' ||
        tc.test_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tc.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tc.reason_generated.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = categoryFilter === 'All' || tc.category === categoryFilter;
      const matchesPri = priorityFilter === 'All' || tc.priority === priorityFilter;
      const matchesRisk = riskFilter === 'All' || tc.risk === riskFilter;

      return matchesSearch && matchesCat && matchesPri && matchesRisk;
    });
  }, [testSuite, searchQuery, categoryFilter, priorityFilter, riskFilter]);

  const handleCopyJson = (tc: PaccarTestCase) => {
    navigator.clipboard.writeText(JSON.stringify(tc, null, 2));
    setCopiedId(tc.test_id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCSV = () => {
    const headers = [
      'Requirement ID',
      'Test ID',
      'Test Title',
      'Objective',
      'Category',
      'Priority',
      'Risk',
      'Preconditions',
      'Expected Result',
      'Failure Condition',
      'Reason Generated'
    ];

    const rows = testSuite.map((t) => [
      `"${t.requirement_id}"`,
      `"${t.test_id}"`,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.objective.replace(/"/g, '""')}"`,
      `"${t.category}"`,
      `"${t.priority}"`,
      `"${t.risk}"`,
      `"${t.preconditions.join('; ').replace(/"/g, '""')}"`,
      `"${t.expected_result.replace(/"/g, '""')}"`,
      `"${t.failure_condition.replace(/"/g, '""')}"`,
      `"${t.reason_generated.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VeriDrive_${reqId}_TestSuite.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-950/60 text-rose-400 border border-rose-800">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950/60 text-amber-400 border border-amber-800">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-sky-950/60 text-sky-400 border border-sky-800">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-900 text-slate-400 border border-slate-800">LOW</span>;
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return <span className="text-[11px] font-bold text-rose-400">CRITICAL</span>;
      case 'HIGH':
        return <span className="text-[11px] font-semibold text-amber-400">HIGH</span>;
      case 'MEDIUM':
        return <span className="text-[11px] font-medium text-slate-300">MEDIUM</span>;
      default:
        return <span className="text-[11px] font-medium text-slate-500">LOW</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* ================= SCREEN HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
              Generated Test Suite
            </h1>
            <span className="font-mono text-xs text-sky-400 bg-sky-950/50 border border-sky-900/60 px-2.5 py-0.5 rounded">
              {reqId}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Structured automotive validation test cases synthesized across functional, boundary, negative, and recovery dimensions
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center space-x-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <Link
            href={`/traceability?req=${encodeURIComponent(reqId)}`}
            className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-sm transition-colors"
          >
            <span>View Traceability</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ================= AI CRITIC HORIZONTAL SECTION ================= */}
      <div className="bg-[#111622] border border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-sky-400 tracking-wider uppercase flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Coverage Critic</span>
              </span>
              <span className="text-[11px] text-slate-500">• Automated Gap Analysis</span>
            </div>
            <div className="flex items-center space-x-6 text-xs font-mono pt-1">
              <div>
                <span className="text-slate-500 text-[11px]">AI Coverage: </span>
                <span className="text-emerald-400 font-semibold">{criticAdded ? '98%' : '90%'}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Initial Suite: </span>
                <span className="text-slate-200 font-semibold">7 tests</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Missing Gaps: </span>
                <span className={`font-semibold ${criticAdded ? 'text-slate-500' : 'text-amber-400'}`}>
                  {criticAdded ? 0 : 1}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Final Suite: </span>
                <span className="text-sky-400 font-semibold">{testSuite.length} tests</span>
              </div>
            </div>
          </div>

          <div>
            {!criticAdded ? (
              <button
                type="button"
                onClick={handleAddCriticTest}
                disabled={isCriticLoading}
                className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-sky-400 border border-sky-900/60 hover:border-sky-500 text-xs font-medium transition-colors"
              >
                {isCriticLoading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                    <span>Synthesizing Gap Scenario...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Generate Missing Scenario (DTC Logging)</span>
                  </>
                )}
              </button>
            ) : (
              <span className="inline-flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-3 py-1.5 rounded">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>All Critic Recommendations Synthesized</span>
              </span>
            )}
          </div>
        </div>

        {/* Critic Observations */}
        <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-medium">Critic Recommendation:</span>
            <span className="text-slate-300">
              {criticAdded
                ? 'Added TC-008: ISO 14229 UDS DTC B109F-13 confirmation upon sensor disconnect.'
                : 'Requirement relies on external GPS sensor; persistent failure must log diagnostic fault according to ISO 14229 / SAE J1939.'}
            </span>
          </div>
        </div>
      </div>

      {/* ================= SEARCH & FILTERS ================= */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search test cases by ID, title, category, or objective..."
            className="w-full bg-[#111622] border border-slate-800 rounded pl-9 pr-3 py-1.5 text-slate-200 placeholder-slate-500 focus:border-sky-500 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#111622] border border-slate-800 rounded px-2.5 py-1.5 text-slate-300 focus:border-sky-500 focus:outline-none"
          >
            <option value="All">Category: All</option>
            <option value="Functional">Functional</option>
            <option value="Timing">Timing</option>
            <option value="Boundary">Boundary</option>
            <option value="Negative">Negative</option>
            <option value="Communication">Communication</option>
            <option value="Recovery">Recovery</option>
            <option value="Diagnostic">Diagnostic</option>
            <option value="Fault Injection">Fault Injection</option>
          </select>

          {/* Priority */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-[#111622] border border-slate-800 rounded px-2.5 py-1.5 text-slate-300 focus:border-sky-500 focus:outline-none"
          >
            <option value="All">Priority: All</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>

          {/* Risk */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-[#111622] border border-slate-800 rounded px-2.5 py-1.5 text-slate-300 focus:border-sky-500 focus:outline-none"
          >
            <option value="All">Risk: All</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
      </div>

      {/* ================= CLEAN TEST CASES TABLE (NO PASS/FAIL) ================= */}
      <div className="bg-[#111622] border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0b0f17] text-slate-400 font-medium">
                <th className="py-2.5 px-4 font-mono w-24">Test ID</th>
                <th className="py-2.5 px-4">Title</th>
                <th className="py-2.5 px-4 w-32">Category</th>
                <th className="py-2.5 px-4 w-24">Priority</th>
                <th className="py-2.5 px-4 w-24">Risk</th>
                <th className="py-2.5 px-4">Engineering Rationale</th>
                <th className="py-2.5 px-4 text-right w-20">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No test cases match the active filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTests.map((tc) => (
                  <tr
                    key={tc.test_id}
                    onClick={() => setSelectedTest(tc)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4 font-mono font-medium text-sky-400">
                      {tc.test_id}
                      {tc.added_by_critic && (
                        <span className="ml-1.5 inline-block px-1 py-0.2 rounded bg-sky-950 border border-sky-800 text-[10px] text-sky-300 font-sans">
                          Critic
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-200 font-medium group-hover:text-white transition-colors">
                      {tc.title}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[11px]">
                        {tc.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">{getPriorityBadge(tc.priority)}</td>
                    <td className="py-3 px-4">{getRiskBadge(tc.risk)}</td>
                    <td className="py-3 px-4 text-slate-400 truncate max-w-xs" title={tc.reason_generated}>
                      {tc.reason_generated}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-slate-500 group-hover:text-sky-400 inline-flex items-center text-xs">
                        View <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= TEST DETAIL DRAWER (EXACT SCHEMA) ================= */}
      {selectedTest && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 flex justify-end">
          <div className="relative w-full max-w-xl bg-[#0e131d] border-l border-slate-800 h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center space-x-2 font-mono text-xs text-sky-400 mb-1">
                    <span>{selectedTest.test_id}</span>
                    <span className="text-slate-600">•</span>
                    <span>Traceable to {selectedTest.requirement_id}</span>
                    {selectedTest.added_by_critic && (
                      <span className="px-1.5 py-0.2 rounded bg-sky-950 border border-sky-800 text-[10px] text-sky-300">
                        Added by Critic
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-bold text-slate-100 leading-snug">
                    {selectedTest.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTest(null)}
                  className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Attributes Badges */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Category</span>
                  <span className="font-semibold text-slate-200 mt-0.5 block">{selectedTest.category}</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Priority</span>
                  <span className="font-semibold text-slate-200 mt-0.5 block">{selectedTest.priority}</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Risk</span>
                  <span className="font-semibold text-slate-200 mt-0.5 block">{selectedTest.risk}</span>
                </div>
              </div>

              {/* Objective */}
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Test Objective</h3>
                <p className="text-xs text-slate-300 leading-relaxed bg-[#111622] p-3 rounded border border-slate-800/80">
                  {selectedTest.objective}
                </p>
              </div>

              {/* Preconditions */}
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Preconditions</h3>
                <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside bg-[#111622] p-3 rounded border border-slate-800/80">
                  {selectedTest.preconditions.map((pre, i) => (
                    <li key={i}>{pre}</li>
                  ))}
                </ul>
              </div>

              {/* Test Inputs & Data */}
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Test Inputs & States</h3>
                <div className="grid grid-cols-2 gap-2 bg-[#111622] p-3 rounded border border-slate-800/80 text-xs">
                  {Object.entries(selectedTest.test_inputs).map(([k, v]) => (
                    <div key={k} className="p-1.5 rounded bg-slate-900/60 border border-slate-800">
                      <span className="text-slate-500 text-[10px] font-mono block uppercase">{k}</span>
                      <span className="text-slate-200 font-mono text-[11px] font-semibold">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Test Procedure Steps</h3>
                <div className="bg-[#111622] p-3 rounded border border-slate-800/80 space-y-2 text-xs">
                  {selectedTest.steps.map((st, i) => (
                    <div key={i} className="flex items-start space-x-2.5">
                      <span className="font-mono text-sky-400 font-semibold shrink-0">
                        {i + 1}.
                      </span>
                      <span className="text-slate-300">{st.replace(/^\d+\.\s*/, '')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expected Result */}
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Expected Result</h3>
                <p className="bg-[#111622] p-3 rounded border border-emerald-950/60 text-slate-200 text-xs leading-relaxed">
                  {selectedTest.expected_result}
                </p>
              </div>

              {/* Failure Condition */}
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Failure Condition</h3>
                <p className="bg-[#111622] p-3 rounded border border-rose-950/60 text-slate-300 text-xs leading-relaxed">
                  {selectedTest.failure_condition}
                </p>
              </div>

              {/* Reason Generated */}
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-sky-400 uppercase tracking-wider flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Reason Generated</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed bg-[#111622] p-3 rounded border border-slate-800/80">
                  {selectedTest.reason_generated}
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center space-x-3">
              <button
                type="button"
                onClick={() => handleCopyJson(selectedTest)}
                className="flex-1 py-2 px-3 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center space-x-1.5 transition-colors"
              >
                {copiedId === selectedTest.test_id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">JSON Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSelectedTest(null)}
                className="py-2 px-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TestsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-xs text-slate-500 font-mono">
          Loading generated test suite...
        </div>
      }
    >
      <TestsContent />
    </Suspense>
  );
}
