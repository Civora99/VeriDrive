'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TestCase, SuiteExecutionSummary } from '@/lib/types/tests';
import { StructuredRequirement } from '@/lib/types/requirements';
import { ExecutionConsole } from '@/components/execution/ExecutionConsole';
import { DEMO_REQUIREMENTS } from '@/data/demo-requirements';
import { DEMO_TEST_SUITES, DEMO_SIMULATION_RESULTS } from '@/data/demo-results';
import { PlaySquare, Cpu, ChevronLeft, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';

function ExecutionContent() {
  const searchParams = useSearchParams();
  const reqId = searchParams.get('req') || 'REQ-BMS-042';

  const [activeReqId, setActiveReqId] = useState<string>(reqId);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [initialSummary, setInitialSummary] = useState<SuiteExecutionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setActiveReqId(reqId);
  }, [reqId]);

  useEffect(() => {
    async function loadTests() {
      setIsLoading(true);
      const cachedTests = DEMO_TEST_SUITES[activeReqId] || DEMO_TEST_SUITES['REQ-BMS-042'];
      setTestCases(cachedTests);

      const cachedSummary = DEMO_SIMULATION_RESULTS[activeReqId] || DEMO_SIMULATION_RESULTS['REQ-BMS-042'];
      setInitialSummary(cachedSummary);

      setIsLoading(false);
    }

    loadTests();
  }, [activeReqId]);

  const handleSimulate = async (induceDefect: boolean): Promise<SuiteExecutionSummary> => {
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          req_id: activeReqId,
          test_cases: testCases,
          induce_defect: induceDefect
        })
      });

      const data = await res.json();
      if (data.success && data.execution_summary) {
        return data.execution_summary;
      }
    } catch (e) {
      console.warn('Simulation API call fallback to deterministic local runner:', e);
    }

    return DEMO_SIMULATION_RESULTS[activeReqId] || DEMO_SIMULATION_RESULTS['REQ-BMS-042'];
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800 font-mono">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Link
              href={`/tests?req=${encodeURIComponent(activeReqId)}`}
              className="text-slate-400 hover:text-slate-200 flex items-center space-x-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back to Tests</span>
            </Link>
            <span>•</span>
            <PlaySquare className="w-4 h-4" />
            <span>Phase 4 • HIL Bench Simulation & Defect Identification</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-1">
            Automotive HIL Simulation & Safety Defect Insights
          </h1>
        </div>

        {/* ECU Switcher */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400">Target ECU:</span>
          <select
            value={activeReqId}
            onChange={(e) => setActiveReqId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-3 py-1.5 focus:border-cyan-400 focus:outline-none"
          >
            {DEMO_REQUIREMENTS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id}: {r.ecu.split(' ')[0]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="p-16 text-center bg-[#0e1422] border border-slate-800 rounded-lg font-mono text-slate-400 text-xs">
          <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Configuring virtual test bench for {activeReqId}...
        </div>
      ) : (
        <ExecutionConsole
          reqId={activeReqId}
          testCases={testCases}
          initialSummary={initialSummary}
          onExecute={handleSimulate}
        />
      )}
    </div>
  );
}

export default function ExecutionPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center font-mono text-slate-400 text-xs">
          Loading virtual test bench...
        </div>
      }
    >
      <ExecutionContent />
    </Suspense>
  );
}
