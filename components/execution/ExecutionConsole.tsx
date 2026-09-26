'use client';

import React, { useState, useEffect } from 'react';
import { TestCase, SuiteExecutionSummary, TestExecutionResult, CanFrameTrace } from '@/lib/types/tests';
import { DefectInsightCard } from './DefectInsightCard';
import { CategoryBadge } from '../shared/CategoryBadge';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Radio,
  Cpu,
  ShieldAlert,
  Terminal,
  Activity,
  Layers
} from 'lucide-react';

interface ExecutionConsoleProps {
  reqId: string;
  testCases: TestCase[];
  initialSummary: SuiteExecutionSummary | null;
  onExecute: (induceDefect: boolean) => Promise<SuiteExecutionSummary>;
}

export const ExecutionConsole: React.FC<ExecutionConsoleProps> = ({
  reqId,
  testCases,
  initialSummary,
  onExecute
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState<SuiteExecutionSummary | null>(initialSummary);
  const [activeTestResult, setActiveTestResult] = useState<TestExecutionResult | null>(
    initialSummary?.results[initialSummary.results.length > 6 ? 6 : 0] || null
  );
  const [induceDefect, setInduceDefect] = useState(true);
  const [progressIdx, setProgressIdx] = useState(testCases.length);

  // Trigger simulated live execution
  const handleStartExecution = async () => {
    setIsRunning(true);
    setProgressIdx(0);

    try {
      const result = await onExecute(induceDefect);

      // Simulate sequential step-by-step progress visually
      for (let i = 1; i <= result.results.length; i++) {
        await new Promise((res) => setTimeout(res, 220));
        setProgressIdx(i);
        setActiveTestResult(result.results[i - 1]);
      }

      setSummary(result);
      // Default to failure item if present for maximum demo impact
      const failedItem = result.results.find((r) => r.status === 'FAILED');
      if (failedItem) {
        setActiveTestResult(failedItem);
      }
    } catch (e) {
      console.error('Execution simulation error:', e);
    } finally {
      setIsRunning(false);
    }
  };

  const defectFound = summary?.results.find((r) => r.defect);

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Test Bench Control Panel */}
      <div className="bg-[#0e1422] border border-slate-800 rounded-lg p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2.5">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-slate-100">
                Automotive HIL/SIL Virtual Test Bench
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/50">
                BENCH RUNNER READY
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              CAN 2.0B / CAN-FD frame injection, microsecond timestamping & ISO 14229 assertion engine
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={induceDefect}
                onChange={(e) => setInduceDefect(e.target.checked)}
                disabled={isRunning}
                className="rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-0"
              />
              <span className="text-[11px] text-rose-300">Induce ASIL-D Race Condition</span>
            </label>

            <button
              onClick={handleStartExecution}
              disabled={isRunning || testCases.length === 0}
              className="flex items-center space-x-2 px-5 py-2.5 rounded bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all"
            >
              {isRunning ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Executing HIL Bench ({progressIdx}/{testCases.length})...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Execute Virtual HIL Suite</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Execution Summary KPIs */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4">
            <div className="p-3 rounded bg-slate-950 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Executed</div>
              <div className="text-base font-bold text-slate-200 mt-0.5">{summary.total_tests} Tests</div>
            </div>
            <div className="p-3 rounded bg-emerald-950/20 border border-emerald-900/40 text-center">
              <div className="text-[10px] text-emerald-400 uppercase tracking-wider">Passed</div>
              <div className="text-base font-bold text-emerald-400 mt-0.5">{summary.passed}</div>
            </div>
            <div className="p-3 rounded bg-rose-950/20 border border-rose-900/40 text-center">
              <div className="text-[10px] text-rose-400 uppercase tracking-wider">Failures</div>
              <div className="text-base font-bold text-rose-400 mt-0.5">{summary.failed}</div>
            </div>
            <div className="p-3 rounded bg-slate-950 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Avg Latency</div>
              <div className="text-base font-bold text-amber-300 mt-0.5">{summary.average_latency_ms} ms</div>
            </div>
            <div className="p-3 rounded bg-slate-950 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Peak Latency</div>
              <div className="text-base font-bold text-amber-400 mt-0.5">{summary.max_latency_ms} ms</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Execution Split View: Test List vs Live Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Test Suite Execution List */}
        <div className="lg:col-span-5 space-y-2">
          <div className="flex items-center justify-between px-2 text-slate-400 text-xs font-semibold">
            <span>Test Case Pipeline ({testCases.length})</span>
            <span>Status / Latency</span>
          </div>

          <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
            {testCases.map((tc, idx) => {
              const res = summary?.results.find((r) => r.test_case_id === tc.id);
              const isSelected = activeTestResult?.test_case_id === tc.id;
              const hasRun = idx < progressIdx;

              return (
                <div
                  key={tc.id}
                  onClick={() => res && setActiveTestResult(res)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500/70 shadow-md'
                      : 'bg-[#0b101a] border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-cyan-400">{tc.id}</span>
                      <CategoryBadge category={tc.category} />
                    </div>

                    <div>
                      {!hasRun && isRunning ? (
                        <span className="text-[10px] text-slate-500">PENDING</span>
                      ) : res?.status === 'PASSED' ? (
                        <span className="text-[11px] font-bold text-emerald-400 flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>PASS ({res.measured_latency_ms}ms)</span>
                        </span>
                      ) : res?.status === 'FAILED' ? (
                        <span className="text-[11px] font-bold text-rose-400 flex items-center space-x-1 animate-pulse">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>FAIL ({res.measured_latency_ms}ms)</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">READY</span>
                      )}
                    </div>
                  </div>

                  <div className="text-slate-300 truncate text-[11px]">{tc.title}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Test Detail & CAN Bus Trace Console */}
        <div className="lg:col-span-7 space-y-4">
          {activeTestResult ? (
            <div className="bg-[#0b101a] border border-slate-800 rounded-lg p-4 space-y-4 shadow-xl">
              <div className="flex items-start justify-between border-b border-slate-800/80 pb-3">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-cyan-400 font-bold text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                      {activeTestResult.test_case_id}
                    </span>
                    <CategoryBadge category={activeTestResult.category} />
                    {activeTestResult.status === 'PASSED' ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/50 font-bold">
                        VERIFIED PASSED
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-600/50 font-bold">
                        CRITICAL SAFETY FAILURE
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-100 text-sm">{activeTestResult.test_title}</h4>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[10px] text-slate-400">Response Latency:</div>
                  <div
                    className={`text-sm font-bold ${
                      activeTestResult.status === 'PASSED' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {activeTestResult.measured_latency_ms} ms{' '}
                    <span className="text-[10px] text-slate-500">
                      / max {activeTestResult.allowed_latency_ms} ms
                    </span>
                  </div>
                </div>
              </div>

              {/* Step Logs */}
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1.5">
                  Execution Verification Sequence:
                </span>
                <div className="space-y-1.5">
                  {activeTestResult.step_results.map((st) => (
                    <div
                      key={st.step_num}
                      className={`p-2 rounded text-[11px] flex items-start space-x-2 ${
                        st.passed
                          ? 'bg-slate-950 border border-slate-800/80 text-slate-300'
                          : 'bg-rose-950/30 border border-rose-900/50 text-rose-300'
                      }`}
                    >
                      {st.passed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-bold mr-1">Step {st.step_num}:</span>
                        <span>{st.log}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Real-time CAN Bus Telemetry Trace Window */}
              <div>
                <div className="flex items-center justify-between text-slate-400 font-bold uppercase text-[10px] tracking-wider mb-1.5">
                  <div className="flex items-center space-x-1.5 text-cyan-400">
                    <Radio className="w-3.5 h-3.5" />
                    <span>CANoe Bus Monitor Telemetry Trace (Real-Time)</span>
                  </div>
                  <span className="text-slate-500">Bitrate: 500 kbps (Autosar E2E)</span>
                </div>

                <div className="bg-[#05080f] border border-slate-800 rounded p-2.5 font-mono text-[11px] overflow-x-auto max-h-48 overflow-y-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-800 text-[10px]">
                        <th className="pb-1">Time (ms)</th>
                        <th className="pb-1">Bus</th>
                        <th className="pb-1">CAN ID</th>
                        <th className="pb-1">Dir</th>
                        <th className="pb-1">DLC</th>
                        <th className="pb-1">Data (HEX)</th>
                        <th className="pb-1">Decoded Signal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-slate-300">
                      {activeTestResult.can_trace.map((frame, fIdx) => (
                        <tr key={fIdx} className="hover:bg-slate-900/40">
                          <td className="py-1 text-slate-400">{frame.timestamp_ms.toFixed(1)}</td>
                          <td className="py-1 text-slate-400">{frame.bus.split('_')[0]}</td>
                          <td className="py-1 font-bold text-cyan-300">{frame.id}</td>
                          <td className="py-1">
                            <span
                              className={`text-[9px] px-1 rounded font-bold ${
                                frame.direction === 'Tx'
                                  ? 'bg-blue-950 text-blue-300'
                                  : frame.direction === 'Rx'
                                  ? 'bg-emerald-950 text-emerald-300'
                                  : 'bg-rose-950 text-rose-300'
                              }`}
                            >
                              {frame.direction}
                            </span>
                          </td>
                          <td className="py-1 text-slate-400">{frame.dlc}</td>
                          <td className="py-1 text-amber-300 font-mono text-[10px]">{frame.data}</td>
                          <td className="py-1 text-slate-300 truncate max-w-xs">
                            {frame.signal_decoded || 'Standard Frame'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-[#0b101a] border border-slate-800 rounded-lg text-slate-500">
              Select a test from the left panel to inspect step assertions and CAN telemetry.
            </div>
          )}
        </div>
      </div>

      {/* Critical Defect Root Cause Card if failure occurred */}
      {defectFound?.defect && (
        <div className="pt-2">
          <DefectInsightCard defect={defectFound.defect} />
        </div>
      )}
    </div>
  );
};
