'use client';

import React, { useState } from 'react';
import { TestCase } from '@/lib/types/tests';
import { CategoryBadge } from '../shared/CategoryBadge';
import { AsilBadge } from '../shared/AsilBadge';
import { CodeModal } from '../shared/CodeModal';
import {
  X,
  Clock,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  FileCode,
  AlertCircle,
  Cpu
} from 'lucide-react';

interface TestCaseDrawerProps {
  testCase: TestCase | null;
  onClose: () => void;
}

export const TestCaseDrawer: React.FC<TestCaseDrawerProps> = ({ testCase, onClose }) => {
  const [showCodeModal, setShowCodeModal] = useState(false);

  if (!testCase) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs flex justify-end">
        <div className="bg-[#0b101a] border-l border-slate-800 w-full max-w-2xl h-full overflow-y-auto flex flex-col shadow-2xl">
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-800 bg-[#0e1422] sticky top-0 z-10 flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2.5 mb-1.5">
                <span className="font-mono text-sm font-bold text-cyan-400 bg-slate-900 px-2.5 py-0.5 rounded border border-slate-700">
                  {testCase.id}
                </span>
                <CategoryBadge category={testCase.category} />
                <AsilBadge level={testCase.asil_target} />
              </div>
              <h2 className="text-base font-bold text-slate-100">{testCase.title}</h2>
              <div className="text-xs font-mono text-slate-400 mt-0.5">
                Traceable Target: <span className="text-cyan-300">{testCase.req_id}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-100 p-1.5 rounded hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-6 font-mono text-xs flex-1">
            {/* Description */}
            <div className="p-3 rounded bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">
                Verification Objective:
              </span>
              <p className="text-slate-200 text-xs leading-relaxed">{testCase.description}</p>
            </div>

            {/* Critic feedback note if revised */}
            {testCase.revised_by_critic && testCase.critic_feedback && (
              <div className="p-3 rounded bg-amber-950/30 border border-amber-800/60 text-amber-200">
                <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Senior Critic Revision ({testCase.critic_feedback.critique_type}):</span>
                </div>
                <p className="text-xs text-slate-300 mb-1">{testCase.critic_feedback.comment}</p>
                {testCase.critic_feedback.suggested_revision && (
                  <div className="text-[11px] text-amber-300 bg-amber-950/60 p-2 rounded border border-amber-900/50">
                    <span className="font-bold">Hardened Assertion: </span>
                    {testCase.critic_feedback.suggested_revision}
                  </div>
                )}
              </div>
            )}

            {/* Preconditions */}
            <div>
              <div className="flex items-center space-x-2 text-slate-300 font-bold uppercase tracking-wider mb-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Bench Preconditions</span>
              </div>
              <ul className="space-y-1.5 list-disc list-inside text-slate-300 bg-slate-950 p-3 rounded border border-slate-800">
                {testCase.preconditions.map((p, idx) => (
                  <li key={idx} className="marker:text-cyan-500">
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            {/* Test Steps */}
            <div>
              <div className="flex items-center space-x-2 text-slate-300 font-bold uppercase tracking-wider mb-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Execution Steps & CAN Bus Stimulus</span>
              </div>
              <div className="space-y-2.5">
                {testCase.steps.map((s) => (
                  <div
                    key={s.step_num}
                    className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-cyan-400">Step {s.step_num}</span>
                      {s.dwell_time_ms && (
                        <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>Dwell: {s.dwell_time_ms}ms</span>
                        </span>
                      )}
                    </div>
                    <div className="text-slate-200">{s.action}</div>
                    {s.can_bus_injection && (
                      <div className="mt-1 p-2 rounded bg-[#070b12] border border-cyan-900/40 text-cyan-300 font-mono text-[11px]">
                        <span className="text-slate-500 mr-2">CAN Injection:</span>
                        {s.can_bus_injection}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Expected Results & Timing */}
            <div>
              <div className="flex items-center space-x-2 text-slate-300 font-bold uppercase tracking-wider mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Deterministic Expected Results & Assertions</span>
              </div>
              <div className="space-y-2.5">
                {testCase.expected_results.map((er) => (
                  <div
                    key={er.check_num}
                    className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-400">Check {er.check_num}</span>
                      {er.max_latency_ms && (
                        <span className="text-[11px] font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                          Latency ≤ {er.max_latency_ms} ms
                        </span>
                      )}
                    </div>
                    <div className="text-slate-200">{er.expectation}</div>
                    {er.can_message_assertion && (
                      <div className="p-2 rounded bg-[#070b12] border border-slate-800 text-slate-300 font-mono text-[11px]">
                        <span className="text-emerald-500 mr-2">Bus Assertion:</span>
                        {er.can_message_assertion}
                      </div>
                    )}
                    {er.uds_response && (
                      <div className="p-2 rounded bg-indigo-950/30 border border-indigo-900/40 text-indigo-300 font-mono text-[11px]">
                        <span className="text-indigo-400 mr-2">UDS Response:</span>
                        {er.uds_response}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Cleanup */}
            {testCase.cleanup.length > 0 && (
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">
                  Post-Test Safe Quiescent State Cleanup:
                </span>
                <ul className="text-slate-400 text-xs list-disc list-inside">
                  {testCase.cleanup.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 border-t border-slate-800 bg-[#0e1422] sticky bottom-0 z-10 flex items-center justify-between">
            <button
              onClick={() => setShowCodeModal(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-semibold transition-all"
            >
              <FileCode className="w-4 h-4" />
              <span>Export Vector CANoe / CAPL Script</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <CodeModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        testCase={testCase}
      />
    </>
  );
};
