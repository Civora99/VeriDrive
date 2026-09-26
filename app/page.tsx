import React from 'react';
import { getRequirementsList, getTestCasesForRequirement, getExecutionSummary } from '@/lib/supabase/queries';
import { calculateCoverageMetrics } from '@/lib/validation/coverage';
import { DashboardKpiCards } from '@/components/dashboard/DashboardKpiCards';
import { CoverageCharts } from '@/components/dashboard/CoverageCharts';
import { RecentRunsTable } from '@/components/dashboard/RecentRunsTable';
import { TestCase } from '@/lib/types/tests';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const requirements = await getRequirementsList();

  // Load all test cases for active requirements
  const allTests: TestCase[] = [];
  const testCounts: Record<string, number> = {};
  const statusMap: Record<string, 'PASSED' | 'FAILED' | 'READY'> = {};

  let failedTestsCount = 0;

  for (const req of requirements) {
    const tests = await getTestCasesForRequirement(req.id);
    allTests.push(...tests);
    testCounts[req.id] = tests.length;

    const summary = await getExecutionSummary(req.id);
    if (summary) {
      if (summary.failed > 0) {
        statusMap[req.id] = 'FAILED';
        failedTestsCount += summary.failed;
      } else {
        statusMap[req.id] = 'PASSED';
      }
    } else {
      statusMap[req.id] = 'READY';
    }
  }

  const coverageMetrics = calculateCoverageMetrics(requirements, allTests);
  const highRiskCount = requirements.filter((r) => r.risk_score >= 80).length;

  return (
    <div className="space-y-6">
      <DashboardKpiCards
        totalReqs={requirements.length}
        totalTests={allTests.length}
        coveragePct={coverageMetrics.asil_d_coverage_pct}
        highRiskCount={highRiskCount}
        failedTestsCount={failedTestsCount}
        uncoveredCount={coverageMetrics.missing_mandatory_categories.length}
      />

      <CoverageCharts metrics={coverageMetrics} />

      <RecentRunsTable
        requirements={requirements}
        testCounts={testCounts}
        statusMap={statusMap}
      />
    </div>
  );
}
