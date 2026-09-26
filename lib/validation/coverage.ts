import { StructuredRequirement } from '../types/requirements';
import { TestCase, TestCategory } from '../types/tests';

export interface CoverageMetrics {
  total_requirements: number;
  total_tests: number;
  asil_d_coverage_pct: number;
  overall_coverage_pct: number;
  category_distribution: Record<TestCategory, number>;
  category_percentages: Record<TestCategory, number>;
  ecu_breakdown: Array<{
    ecu: string;
    req_count: number;
    test_count: number;
    coverage_pct: number;
    asil_level: string;
  }>;
  missing_mandatory_categories: TestCategory[];
}

const ALL_CATEGORIES: TestCategory[] = [
  'Happy-Path',
  'Boundary',
  'Negative',
  'Timing',
  'Communication-Loss',
  'Fault-Injection',
  'Power-Cycle',
  'Recovery',
  'Diagnostic',
  'Cross-Component'
];

export function calculateCoverageMetrics(
  requirements: StructuredRequirement[],
  tests: TestCase[]
): CoverageMetrics {
  const categoryCounts: Record<TestCategory, number> = {
    'Happy-Path': 0,
    Boundary: 0,
    Negative: 0,
    Timing: 0,
    'Communication-Loss': 0,
    'Fault-Injection': 0,
    'Power-Cycle': 0,
    Recovery: 0,
    Diagnostic: 0,
    'Cross-Component': 0
  };

  tests.forEach((tc) => {
    if (categoryCounts[tc.category] !== undefined) {
      categoryCounts[tc.category]++;
    }
  });

  const totalTests = tests.length;
  const categoryPercentages: Record<TestCategory, number> = {} as any;
  ALL_CATEGORIES.forEach((cat) => {
    categoryPercentages[cat] = totalTests > 0 ? Math.round((categoryCounts[cat] / totalTests) * 100) : 0;
  });

  const missingCategories = ALL_CATEGORIES.filter((cat) => categoryCounts[cat] === 0);

  // ASIL-D test coverage
  const asilDReqs = requirements.filter((r) => r.asil_level === 'ASIL-D');
  const asilDTests = tests.filter((t) => t.asil_target === 'ASIL-D');
  const asilDCoveragePct =
    asilDReqs.length > 0
      ? Math.min(100, Math.round((asilDTests.length / (asilDReqs.length * 8)) * 100))
      : 100;

  // ECU breakdown
  const ecuMap = new Map<string, { reqs: StructuredRequirement[]; testCount: number }>();
  requirements.forEach((req) => {
    const existing = ecuMap.get(req.ecu) || { reqs: [], testCount: 0 };
    existing.reqs.push(req);
    ecuMap.set(req.ecu, existing);
  });

  tests.forEach((t) => {
    for (const [, val] of ecuMap.entries()) {
      if (val.reqs.some((r) => r.id === t.req_id)) {
        val.testCount++;
        break;
      }
    }
  });

  const ecuBreakdown = Array.from(ecuMap.entries()).map(([ecu, data]) => {
    const expectedTests = data.reqs.length * 10;
    const coverage = expectedTests > 0 ? Math.min(100, Math.round((data.testCount / expectedTests) * 100)) : 0;
    return {
      ecu,
      req_count: data.reqs.length,
      test_count: data.testCount,
      coverage_pct: coverage,
      asil_level: data.reqs[0]?.asil_level || 'QM'
    };
  });

  const overallCoveragePct =
    requirements.length > 0
      ? Math.min(100, Math.round((tests.length / (requirements.length * 10)) * 100))
      : 0;

  return {
    total_requirements: requirements.length,
    total_tests: tests.length,
    asil_d_coverage_pct: asilDCoveragePct,
    overall_coverage_pct: overallCoveragePct,
    category_distribution: categoryCounts,
    category_percentages: categoryPercentages,
    ecu_breakdown: ecuBreakdown,
    missing_mandatory_categories: missingCategories
  };
}
