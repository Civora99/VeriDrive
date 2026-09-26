'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  X,
  FileCode2,
  ChevronRight,
  ShieldAlert,
  Info,
  ExternalLink,
  Check
} from 'lucide-react';
import { DEMO_REQUIREMENTS } from '@/data/demo-requirements';

interface ValidationRow {
  id: string;
  title: string;
  status: 'PASS' | 'FAIL' | 'NOT RUN';
  execution_time: string;
  is_failure?: boolean;
}

const DEFAULT_TESTS: ValidationRow[] = [
  { id: 'TC-001', title: 'Periodic Cloud Telemetry Transmission at 10-Second Cadence', status: 'PASS', execution_time: '14ms' },
  { id: 'TC-002', title: '10-Second Periodic Interval Jitter and Drift Boundary', status: 'PASS', execution_time: '28ms' },
  { id: 'TC-003', title: 'GNSS Antenna Disconnect / Fix Loss Handling with Quality Flag', status: 'PASS', execution_time: '12ms' },
  { id: 'TC-004', title: 'Stale Coordinate Lock & Quality Flag Assertion', status: 'FAIL', execution_time: '310ms', is_failure: true },
  { id: 'TC-005', title: 'Cellular Carrier Outage and Flash Ring-Buffer Queue Ingestion', status: 'PASS', execution_time: '18ms' },
  { id: 'TC-006', title: 'KL15 Ignition Power Cycle Reboot and Fast Cloud Reconnection', status: 'PASS', execution_time: '22ms' },
  { id: 'TC-007', title: 'Cellular Reconnection and Buffered Telemetry Batch Flush', status: 'PASS', execution_time: '35ms' },
  { id: 'TC-008', title: 'Corrupted NMEA Latitude/Longitude Sentence & Checksum Invalidation', status: 'PASS', execution_time: '16ms' },
  { id: 'TC-009', title: 'ECU Restart Recovery Under Brownout Voltage Drop', status: 'PASS', execution_time: '19ms' },
  { id: 'TC-010', title: 'Cellular Network Socket Timeout & Keepalive Resynchronization', status: 'PASS', execution_time: '24ms' },
  { id: 'TC-011', title: 'CAN Bus-Off Recovery During High-Load Transmission Burst', status: 'PASS', execution_time: '15ms' },
  { id: 'TC-012', title: 'Over-The-Air (OTA) Firmware Flash Memory Partition Swap', status: 'NOT RUN', execution_time: '—' },
  { id: 'TC-013', title: 'High-Temperature Modem Thermal Throttling Fallback Cadence', status: 'NOT RUN', execution_time: '—' }
];

function ValidationContent() {
  const searchParams = useSearchParams();
  const reqId = searchParams.get('req') || 'REQ-TLM-001';

  const [tests, setTests] = useState<ValidationRow[]>(DEFAULT_TESTS);
  const [isRunning, setIsRunning] = useState(false);
  const [runningStep, setRunningStep] = useState<string | null>(null);
  const [selectedFailure, setSelectedFailure] = useState<ValidationRow | null>(null);
  const [copiedDefect, setCopiedDefect] = useState(false);

  const passedCount = tests.filter((t) => t.status === 'PASS').length;
  const failedCount = tests.filter((t) => t.status === 'FAIL').length;
  const notRunCount = tests.filter((t) => t.status === 'NOT RUN').length;

  const handleRunValidation = async () => {
    setIsRunning(true);
    setRunningStep('Preparing validation');

    try {
      // Step 1: Preparing
      await new Promise((r) => setTimeout(r, 400));
      setRunningStep('Running tests via Python backend');

      // Map current tests to Python format
      const pyTestsPayload = tests.map((t) => ({
        test_id: t.id,
        requirement_id: reqId,
        title: t.title,
        category: t.title.toLowerCase().includes('jitter')
          ? 'Timing'
          : t.title.toLowerCase().includes('disconnect')
          ? 'Negative'
          : t.title.toLowerCase().includes('stale')
          ? 'Boundary'
          : t.title.toLowerCase().includes('cellular')
          ? 'Communication'
          : t.title.toLowerCase().includes('power')
          ? 'Fault Injection'
          : 'Functional',
        priority: 'HIGH',
        risk: 'HIGH',
        preconditions: ['Ignition ON', 'Cellular available'],
        steps: ['Inject simulated input into virtual CAN/telematics buffer'],
        expected_result: 'Vehicle GPS transmitted to cloud every 10 seconds without stale data freeze',
        reason_generated: 'Automotive validation'
      }));

      // Query Python backend /run-tests
      let runResponse: any = null;
      try {
        const pyRes = await fetch('http://127.0.0.1:8000/run-tests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tests: pyTestsPayload })
        });
        if (pyRes.ok) {
          runResponse = await pyRes.json();
        }
      } catch (directErr) {
        console.warn('Direct Python /run-tests failed, falling back to /api/simulate proxy:', directErr);
      }

      if (!runResponse) {
        const simRes = await fetch('/api/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tests: pyTestsPayload })
        });
        if (simRes.ok) {
          runResponse = await simRes.json();
        }
      }

      setRunningStep('Analyzing results');
      await new Promise((r) => setTimeout(r, 400));

      if (runResponse && runResponse.results) {
        const updated = tests.map((t) => {
          const matched = runResponse.results.find((r: any) => r.test_id === t.id);
          if (matched) {
            return {
              ...t,
              status: matched.status as any,
              is_failure: matched.status === 'FAIL',
              execution_time: matched.status === 'FAIL' ? '310ms' : `${Math.floor(Math.random() * 20 + 12)}ms`
            };
          }
          return t;
        });
        setTests(updated);
      }

      setRunningStep('Complete');
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.warn('Validation execution error:', err);
    } finally {
      setIsRunning(false);
      setRunningStep(null);
    }
  };

  const handleCopyDefect = () => {
    const report = `DEFECT REPORT: DEF-001
Test: TC-004 (Stale Coordinate Lock & Quality Flag Assertion)
Requirement: REQ-TLM-001 (Telematics ECU)
Severity: High (ASIL-B)
Expected: Quality flag transitions to STALE (0x02) after 3.0s without fresh GPS lock.
Observed: Stale GPS position transmitted after GPS signal froze; payload lacked warning flag.
Failure Reason: ECU firmware failed to assert data invalidity flag when coordinate buffer ceased updating.
Likely Area: telematics/gnss_filter.c:248
Recommended Fix: Promote debounce counter in gnss_filter.c to uint32_t and clamp timeout to 3000ms.`;
    navigator.clipboard.writeText(report);
    setCopiedDefect(true);
    setTimeout(() => setCopiedDefect(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
              Validation
            </h1>
            {/* Prominent Simulated Execution Badge */}
            <span
              className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-amber-950/60 text-amber-300 border border-amber-800/80"
              title="Virtual hardware-in-the-loop simulation environment"
            >
              <span>SIMULATED EXECUTION</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulated execution on virtual HIL test bench; not connected to live vehicle hardware.
          </p>
        </div>

        {/* Primary CTA: Run Validation */}
        <button
          type="button"
          onClick={handleRunValidation}
          disabled={isRunning}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white font-semibold text-xs shadow-sm transition-colors self-start sm:self-auto"
        >
          {isRunning ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{runningStep}...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Validation</span>
            </>
          )}
        </button>
      </div>

      {/* Result Summary Banner */}
      <div className="bg-[#111622] border border-slate-800 rounded-lg p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center divide-y sm:divide-y-0 sm:divide-x divide-slate-800">
          <div>
            <div className="text-2xl font-bold font-mono text-slate-100">{tests.length}</div>
            <div className="text-xs text-slate-400 mt-0.5">Tests</div>
          </div>
          <div className="pt-2 sm:pt-0">
            <div className="text-2xl font-bold font-mono text-emerald-400">{passedCount}</div>
            <div className="text-xs text-slate-400 mt-0.5">Passed</div>
          </div>
          <div className="pt-2 sm:pt-0">
            <div className="text-2xl font-bold font-mono text-rose-400">{failedCount}</div>
            <div className="text-xs text-slate-400 mt-0.5">Failed</div>
          </div>
          <div className="pt-2 sm:pt-0">
            <div className="text-2xl font-bold font-mono text-slate-500">{notRunCount}</div>
            <div className="text-xs text-slate-400 mt-0.5">Not Run</div>
          </div>
        </div>
      </div>

      {/* Validation Table */}
      <div className="bg-[#111622] border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0b0f17] text-slate-400 font-medium">
                <th className="py-2.5 px-4 font-mono w-28">Test ID</th>
                <th className="py-2.5 px-4">Title</th>
                <th className="py-2.5 px-4 w-32">Status</th>
                <th className="py-2.5 px-4 font-mono text-right w-36">Execution Time</th>
                <th className="py-2.5 px-4 text-right w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tests.map((t) => {
                const isFail = t.status === 'FAIL';
                return (
                  <tr
                    key={t.id}
                    onClick={() => isFail && setSelectedFailure(t)}
                    className={`transition-colors ${
                      isFail
                        ? 'bg-rose-950/20 hover:bg-rose-950/30 cursor-pointer'
                        : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-medium text-sky-400">
                      {t.id}
                    </td>
                    <td className="py-3 px-4 text-slate-200 font-medium">
                      {t.title}
                    </td>
                    <td className="py-3 px-4">
                      {t.status === 'PASS' && (
                        <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/80">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>PASS</span>
                        </span>
                      )}
                      {t.status === 'FAIL' && (
                        <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-950/80 text-rose-400 border border-rose-800">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>FAIL</span>
                        </span>
                      )}
                      {t.status === 'NOT RUN' && (
                        <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-900 text-slate-500 border border-slate-800">
                          <span>NOT RUN</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-right text-slate-400">
                      {t.execution_time}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isFail ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFailure(t);
                          }}
                          className="inline-flex items-center space-x-1 text-xs text-rose-400 hover:text-rose-300 font-semibold underline underline-offset-2"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-slate-600 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Failure Detail Drawer */}
      {selectedFailure && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 flex justify-end">
          <div className="relative w-full max-w-lg bg-[#0e131d] border-l border-slate-800 h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              {/* Drawer Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Validation Failure</span>
                  </div>
                  <h2 className="text-base font-bold text-slate-100">
                    {selectedFailure.id} • {selectedFailure.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFailure(null)}
                  className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Defect Overview Tag */}
              <div className="p-3 rounded bg-rose-950/30 border border-rose-800/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Defect Reference</span>
                  <span className="font-mono font-bold text-rose-300 text-sm">DEF-001</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[11px] block">Severity</span>
                  <span className="font-bold text-rose-400">HIGH (ASIL-B)</span>
                </div>
              </div>

              {/* Expected */}
              <div className="space-y-1 text-xs">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block">Expected</span>
                <p className="bg-[#111622] p-3 rounded border border-slate-800/80 text-emerald-400 font-mono text-xs leading-relaxed">
                  Quality flag transitions to STALE (0x02) after 3.0s without fresh coordinates; DTC logged to OBD stack.
                </p>
              </div>

              {/* Observed */}
              <div className="space-y-1 text-xs">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block">Observed</span>
                <p className="bg-[#111622] p-3 rounded border border-slate-800/80 text-rose-400 font-mono text-xs leading-relaxed">
                  Quality flag remained locked at VALID (0x01) for 28.5 seconds while vehicle speed was 65 km/h.
                </p>
              </div>

              {/* Failure reason */}
              <div className="space-y-1 text-xs">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block">Failure reason</span>
                <p className="bg-[#111622] p-3 rounded border border-slate-800/80 text-slate-300 leading-relaxed">
                  In telematics firmware, the staleness debounce timer counter overflows on 16-bit register arithmetic, delaying the STALE flag transition during continuous GPS lock loss.
                </p>
              </div>

              {/* Likely area */}
              <div className="space-y-1 text-xs">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block">Likely area</span>
                <div className="bg-[#0b0f17] p-3 rounded border border-slate-800 font-mono text-sky-400 text-xs flex items-center justify-between">
                  <span>telematics/gnss_filter.c:248</span>
                  <span className="text-slate-500 text-[10px]">C Source</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center space-x-3">
              <button
                type="button"
                onClick={handleCopyDefect}
                className="flex-1 py-2 px-4 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors"
              >
                {copiedDefect ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Defect Report Copied!</span>
                  </>
                ) : (
                  <>
                    <FileCode2 className="w-3.5 h-3.5" />
                    <span>View Defect</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setSelectedFailure(null)}
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

export default function ValidationPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-xs text-slate-500">
          Loading validation console...
        </div>
      }
    >
      <ValidationContent />
    </Suspense>
  );
}
