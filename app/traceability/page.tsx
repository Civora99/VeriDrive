'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Network,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Layers,
  FileText
} from 'lucide-react';
import { DEMO_REQUIREMENTS } from '@/data/demo-requirements';
import { DEMO_TEST_SUITES } from '@/data/demo-results';

interface TraceTreeItem {
  id: string;
  title: string;
  category: string;
  passed: boolean;
  failed?: boolean;
}

function TraceabilityContent() {
  const searchParams = useSearchParams();
  const initialReq = searchParams.get('req') || 'REQ-TLM-001';
  const [selectedReqId, setSelectedReqId] = useState<string>(initialReq);

  const requirement = DEMO_REQUIREMENTS.find((r) => r.id === selectedReqId) || DEMO_REQUIREMENTS[0];
  const tests = DEMO_TEST_SUITES[selectedReqId] || DEMO_TEST_SUITES['REQ-TLM-001'] || [];

  // Categorize coverage for right panel
  const categories = [
    { name: 'Functional', covered: true, symbol: '✓' },
    { name: 'Boundary', covered: true, symbol: '✓' },
    { name: 'Negative', covered: true, symbol: '✓' },
    { name: 'Timing', covered: true, symbol: '✓' },
    { name: 'Communication', covered: true, symbol: '✓' },
    { name: 'Recovery', covered: true, symbol: '✓' },
    { name: 'Diagnostic', covered: false, symbol: '—' }
  ];

  // Specific genuine gaps for selected requirement
  const gaps = selectedReqId === 'REQ-TLM-001'
    ? [
        {
          title: 'Multi-constellation GNSS Handover (GPS -> Galileo/GLONASS)',
          reason: 'Requirement does not define behavior during active satellite constellation failover.'
        },
        {
          title: 'Flash memory endurance under high-frequency queue write cycle',
          reason: 'Missing validation for continuous 48-hour buffer retention when cellular connectivity remains unavailable.'
        }
      ]
    : [
        {
          title: 'Sub-zero (-40°C) Cold Soak Thermal Ramp Timing',
          reason: 'Specification limits validation to high temperature derate without low temperature discharge validation.'
        }
      ];

  return (
    <div className="space-y-6">
      {/* Header with Requirement Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
            Traceability
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Requirement → Test Case bi-directional verification matrix
          </p>
        </div>

        {/* Requirement Selector */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400">Requirement:</span>
          <select
            value={selectedReqId}
            onChange={(e) => setSelectedReqId(e.target.value)}
            className="bg-[#111622] border border-slate-700 text-slate-200 text-xs font-mono rounded px-3 py-1.5 focus:border-sky-500 focus:outline-none"
          >
            {DEMO_REQUIREMENTS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id}: {r.ecu.split(' ')[0]} - {r.title.slice(0, 36)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT / CENTER: Tree Hierarchy Layout (2 cols) */}
        <div className="lg:col-span-2 bg-[#111622] border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950/60 border border-sky-900/60 px-2.5 py-1 rounded">
                {requirement.id}
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {requirement.ecu} • {requirement.asil_level}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              {tests.length} Test Verifications Linked
            </span>
          </div>

          <div className="p-3 bg-[#0b0f17] rounded border border-slate-800/80 font-mono text-xs text-slate-300 space-y-2">
            <div className="text-slate-400 text-[11px] uppercase tracking-wider mb-2 font-sans font-medium">
              Specification Text
            </div>
            <p className="font-mono text-xs text-slate-300 leading-relaxed">
              "{requirement.raw_text}"
            </p>
          </div>

          {/* Tree Structure */}
          <div className="space-y-1 pt-2 font-mono text-xs">
            <div className="font-bold text-slate-200 flex items-center space-x-2">
              <span className="text-sky-400">{requirement.id}</span>
              <span className="text-slate-500 text-[11px] font-normal font-sans">
                (Parent Specification Root)
              </span>
            </div>

            <div className="space-y-1.5 pt-1 pl-2">
              {tests.map((tc, index) => {
                const isFail = index === 5 || tc.id === 'TC-TLM-001-06' || tc.id === 'TC-BMS-042-07';
                return (
                  <div
                    key={tc.id}
                    className="flex items-start space-x-2 hover:bg-slate-800/40 p-1.5 rounded transition-colors group"
                  >
                    <span className="text-slate-600 select-none">
                      {index === tests.length - 1 ? '└──' : '├──'}
                    </span>
                    <div className="flex items-baseline space-x-2 flex-1">
                      <span className="text-sky-400 font-semibold group-hover:underline">
                        {tc.id}
                      </span>
                      <span className="text-slate-300 text-xs font-sans truncate max-w-sm">
                        {tc.title}
                      </span>
                      <span className="text-[10px] text-slate-500 font-sans ml-auto">
                        [{tc.category}]
                      </span>
                    </div>

                    <div className="shrink-0 pl-2">
                      {isFail ? (
                        <span className="inline-flex items-center space-x-1 text-rose-400 font-bold text-xs" title="Simulation Failed: Defect Identified">
                          <span>✕</span>
                          <span className="text-[10px] font-sans font-normal opacity-80">FAIL</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-emerald-400 font-bold text-xs" title="Simulation Passed">
                          <span>✓</span>
                          <span className="text-[10px] font-sans font-normal opacity-80">PASS</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Scenario Coverage Checklist (1 col) */}
        <div className="space-y-6">
          <div className="bg-[#111622] border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="pb-3 border-b border-slate-800/80">
              <h2 className="text-sm font-semibold text-slate-200">
                Scenario Coverage
              </h2>
              <p className="text-[11px] text-slate-400">
                Verification distribution by test discipline
              </p>
            </div>

            <div className="space-y-2.5">
              {categories.map((cat) => (
                <div
                  key={cat.name}
                  className="flex items-center justify-between p-2.5 rounded bg-[#0b0f17] border border-slate-800/80 text-xs"
                >
                  <span className="text-slate-300 font-medium">{cat.name}</span>
                  {cat.covered ? (
                    <span className="flex items-center space-x-1 text-emerald-400 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Covered</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-slate-500 text-xs">
                      <span>—</span>
                      <span className="text-[11px]">Uncovered</span>
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 text-[11px] text-slate-500">
              6 of 7 validation dimensions fully synthesized and verified.
            </div>
          </div>
        </div>
      </div>

      {/* BELOW: Coverage Gaps Section */}
      <div className="bg-[#111622] border border-slate-800 rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-slate-200">
              Coverage Gaps
            </h2>
          </div>
          <span className="text-xs text-amber-400/90 font-mono">
            {gaps.length} genuine gaps identified
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
          <span>Adheres to ASPICE SWE.4 Verification Criteria</span>
          <Link
            href={`/tests?req=${encodeURIComponent(selectedReqId)}`}
            className="text-sky-400 hover:text-sky-300 flex items-center space-x-1"
          >
            <span>Generate gap scenarios in Test Suite</span>
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
        <div className="py-20 text-center text-xs text-slate-500">
          Loading traceability matrix...
        </div>
      }
    >
      <TraceabilityContent />
    </Suspense>
  );
}
