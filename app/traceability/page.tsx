'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertCircle,
  Network,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Layers,
  FileText,
  Tag
} from 'lucide-react';
import { DEMO_REQUIREMENTS } from '@/data/demo-requirements';

interface TraceTreeTest {
  test_id: string;
  title: string;
  category: string;
  priority: string;
  risk: string;
}

const TRACE_TESTS: TraceTreeTest[] = [
  { test_id: 'TC-001', title: 'Normal GPS transmission at 10-second cadence', category: 'Functional', priority: 'HIGH', risk: 'HIGH' },
  { test_id: 'TC-002', title: '10-second periodic interval timing boundary and jitter', category: 'Timing', priority: 'HIGH', risk: 'MEDIUM' },
  { test_id: 'TC-003', title: 'GPS signal unavailable / antenna disconnect handling', category: 'Negative', priority: 'HIGH', risk: 'HIGH' },
  { test_id: 'TC-004', title: 'Cellular network unavailable / dead-zone buffering', category: 'Communication', priority: 'HIGH', risk: 'HIGH' },
  { test_id: 'TC-005', title: 'Cellular reconnection and buffered telemetry recovery', category: 'Recovery', priority: 'HIGH', risk: 'HIGH' },
  { test_id: 'TC-006', title: 'ECU ignition power cycle / brownout restart', category: 'Fault Injection', priority: 'MEDIUM', risk: 'HIGH' },
  { test_id: 'TC-007', title: 'Stale GPS position detection while vehicle is in motion', category: 'Boundary', priority: 'HIGH', risk: 'CRITICAL' }
];

function TraceabilityContent() {
  const searchParams = useSearchParams();
  const initialReq = searchParams.get('req') || 'REQ-001';
  const [selectedReqId, setSelectedReqId] = useState<string>(initialReq);

  const categories = [
    { name: 'Functional', count: 1, covered: true },
    { name: 'Timing', count: 1, covered: true },
    { name: 'Negative', count: 1, covered: true },
    { name: 'Communication', count: 1, covered: true },
    { name: 'Recovery', count: 1, covered: true },
    { name: 'Fault Injection', count: 1, covered: true },
    { name: 'Boundary', count: 1, covered: true },
    { name: 'Diagnostic', count: 0, covered: false }
  ];

  const gaps = [
    {
      title: 'Diagnostic trouble code (DTC) logging on persistent GPS failure',
      reason: 'Requirement implies dependency on GPS sensor; persistent loss must log DTC according to ISO 14229 / SAE J1939.'
    },
    {
      title: 'Multi-constellation GNSS handover failover',
      reason: 'Specification omits constellation switching behavior when GPS is jammed or transitioning to Galileo/GLONASS.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
            Requirement Traceability
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Bi-directional verification traceability: Requirement → Synthesized Test Scenarios
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400">Target Requirement:</span>
          <span className="font-mono text-sky-400 bg-sky-950/60 border border-sky-900/60 px-3 py-1 rounded font-semibold">
            {selectedReqId}
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Traceability Tree */}
        <div className="lg:col-span-2 bg-[#111622] border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950/60 border border-sky-900/60 px-2.5 py-1 rounded">
                REQ-001
              </span>
              <span className="text-xs text-slate-300 font-medium">
                Telematics ECU • Functional + Timing
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              {TRACE_TESTS.length} Test Verifications Linked
            </span>
          </div>

          <div className="p-3 bg-[#0b0f17] rounded border border-slate-800/80 font-mono text-xs text-slate-300 space-y-1.5">
            <div className="text-slate-500 text-[11px] uppercase tracking-wider font-sans font-medium">
              Specification Text
            </div>
            <p className="font-mono text-xs text-slate-200 leading-relaxed">
              "The telematics ECU shall transmit vehicle GPS position every 10 seconds when ignition is ON and cellular connectivity is available."
            </p>
          </div>

          {/* Clean Tree Structure (NO PASS/FAIL) */}
          <div className="space-y-1 pt-2 font-mono text-xs">
            <div className="font-bold text-slate-200 flex items-center space-x-2">
              <span className="text-sky-400 font-bold">REQ-001</span>
              <span className="text-slate-500 text-[11px] font-normal font-sans">
                (Parent Specification Node)
              </span>
            </div>

            <div className="space-y-1.5 pt-1 pl-2">
              {TRACE_TESTS.map((tc, index) => {
                const isLast = index === TRACE_TESTS.length - 1;
                return (
                  <div
                    key={tc.test_id}
                    className="flex items-start space-x-2 hover:bg-slate-800/40 p-2 rounded transition-colors group"
                  >
                    <span className="text-slate-600 select-none font-mono">
                      {isLast ? '└──' : '├──'}
                    </span>
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 flex-1">
                      <div className="flex items-baseline space-x-2">
                        <Link
                          href="/tests"
                          className="text-sky-400 font-semibold group-hover:underline font-mono"
                        >
                          {tc.test_id}
                        </Link>
                        <span className="text-slate-200 text-xs font-sans">
                          {tc.title}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0 pt-0.5 sm:pt-0">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-sans">
                          {tc.category}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono font-medium">
                          {tc.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Category Coverage Distribution */}
        <div className="space-y-6">
          <div className="bg-[#111622] border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="pb-3 border-b border-slate-800/80">
              <h2 className="text-sm font-semibold text-slate-200">
                Scenario Coverage Distribution
              </h2>
              <p className="text-[11px] text-slate-400">
                Test synthesis across validation dimensions
              </p>
            </div>

            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat.name}
                  className="flex items-center justify-between p-2.5 rounded bg-[#0b0f17] border border-slate-800/80 text-xs"
                >
                  <span className="text-slate-300 font-medium">{cat.name}</span>
                  {cat.covered ? (
                    <span className="flex items-center space-x-1.5 text-sky-400 font-semibold text-xs font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                      <span>{cat.count} test{cat.count > 1 ? 's' : ''}</span>
                    </span>
                  ) : (
                    <span className="text-slate-500 text-xs font-mono">
                      0 tests
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 text-[11px] text-slate-500">
              7 of 8 automotive validation dimensions synthesized.
            </div>
          </div>
        </div>
      </div>

      {/* Coverage Gaps Identified by Critic */}
      <div className="bg-[#111622] border border-slate-800 rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-slate-200">
              Uncovered Scenarios & Gaps
            </h2>
          </div>
          <span className="text-xs text-amber-400/90 font-mono">
            {gaps.length} gaps flagged by AI Critic
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {gaps.map((gap, i) => (
            <div
              key={i}
              className="p-3.5 rounded bg-[#0b0f17] border border-slate-800/80 space-y-1.5"
            >
              <div className="font-medium text-slate-200 flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span>{gap.title}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed pl-3">
                {gap.reason}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
          <span>Traceable under ASPICE SWE.4 Requirements Verification Criteria</span>
          <Link
            href="/tests"
            className="text-sky-400 hover:text-sky-300 flex items-center space-x-1"
          >
            <span>Review Test Suite</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function TraceabilityPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-xs text-slate-500 font-mono">
          Loading traceability matrix...
        </div>
      }
    >
      <TraceabilityContent />
    </Suspense>
  );
}
