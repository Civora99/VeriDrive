import React from 'react';
import { getRequirementsList, getTestCasesForRequirement, getExecutionSummary } from '@/lib/supabase/queries';
import { TraceabilityMatrix } from '@/components/traceability/TraceabilityMatrix';
import { TestCase, SuiteExecutionSummary } from '@/lib/types/tests';
import { Network } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TraceabilityPage() {
  const requirements = await getRequirementsList();

  const allTests: TestCase[] = [];
  const executions: Record<string, SuiteExecutionSummary> = {};

  for (const req of requirements) {
    const tests = await getTestCasesForRequirement(req.id);
    allTests.push(...tests);

    const exec = await getExecutionSummary(req.id);
    if (exec) {
      executions[req.id] = exec;
    }
  }

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-slate-800 font-mono">
        <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
          <Network className="w-4 h-4" />
          <span>Phase 3 • Requirements Traceability Matrix (RTM)</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-1">
          End-to-End Automotive Traceability
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Auditable verification links adhering to ISO 26262 Part 8 Cl. 9 and ASPICE SWE.4 / SWE.5
        </p>
      </div>

      <TraceabilityMatrix
        requirements={requirements}
        testCases={allTests}
        executions={executions}
      />
    </div>
  );
}
