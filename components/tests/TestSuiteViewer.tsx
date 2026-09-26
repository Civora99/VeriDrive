'use client';

import React, { useState } from 'react';
import { TestCase, TestCategory, CriticReview } from '@/lib/types/tests';
import { CategoryBadge } from '../shared/CategoryBadge';
import { AsilBadge } from '../shared/AsilBadge';
import { TestCaseDrawer } from './TestCaseDrawer';
import { CriticComparisonPanel } from './CriticComparisonPanel';
import {
  FileCode2,
  Clock,
  Sparkles,
  ShieldCheck,
  Play,
  FileCode,
  Filter,
  CheckCircle,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import Link from 'next/link';

interface TestSuiteViewerProps {
  reqId: string;
  testCases: TestCase[];
  criticReview: CriticReview | null;
  onRunCritic: () => Promise<void>;
  isCriticLoading: boolean;
}

export const TestSuiteViewer: React.FC<TestSuiteViewerProps> = ({
  reqId,
  testCases,
  criticReview,
  onRunCritic,
  isCriticLoading
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedAsil, setSelectedAsil] = useState<string>('All');
  const [activeTest, setActiveTest] = useState<TestCase | null>(null);
  const [showCriticOnly, setShowCriticOnly] = useState<boolean>(false);

  const categories: Array<'All' | TestCategory> = [
    'All',
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

  const filteredTests = testCases.filter((tc) => {
    if (selectedCategory !== 'All' && tc.category !== selectedCategory) return false;
    if (selectedAsil !== 'All' && tc.asil_target !== selectedAsil) return false;
    if (showCriticOnly && !tc.revised_by_critic) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Critic Review Box if available */}
      {criticReview && <CriticComparisonPanel review={criticReview} />}

      {/* Main Suite Controls Header */}
      <div className="bg-[#0e1422] border border-slate-800 rounded-lg p-4 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2.5">
              <FileCode2 className="w-5 h-5 text-cyan-400" />
              <h2 className="font-mono text-base font-bold text-slate-100">
                10-Category Automotive Validation Suite
              </h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                {filteredTests.length} / {testCases.length} Tests
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Traceable to Requirement <span className="text-cyan-300 font-bold">{reqId}</span>
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onRunCritic}
              disabled={isCriticLoading}
              className="flex items-center space-x-2 px-3.5 py-2 rounded bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-600/50 font-mono text-xs font-semibold shadow-sm transition-all"
            >
              {isCriticLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <span>Critic Auditing...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>{criticReview ? 'Re-run Critic Review' : 'Run AI Critic Review'}</span>
                </>
              )}
            </button>

            <Link
              href={`/execution?req=${encodeURIComponent(reqId)}`}
              className="flex items-center space-x-2 px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold shadow-[0_0_12px_rgba(0,229,255,0.3)] transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Simulate HIL Execution</span>
            </Link>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="pt-3 space-y-3">
          {/* Category Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs font-mono">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0 mr-1" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sub Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono pt-1 text-slate-400">
            <div className="flex items-center space-x-2">
              <span>ASIL Target:</span>
              {['All', 'ASIL-D', 'ASIL-C', 'ASIL-B', 'QM'].map((asil) => (
                <button
                  key={asil}
                  onClick={() => setSelectedAsil(asil)}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    selectedAsil === asil
                      ? 'bg-slate-800 text-cyan-300 border-cyan-500/50 font-bold'
                      : 'border-slate-800 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {asil}
                </button>
              ))}
            </div>

            <label className="flex items-center space-x-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={showCriticOnly}
                onChange={(e) => setShowCriticOnly(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0"
              />
              <span className="text-[11px]">Show Critic Revised / Added Edge Cases Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Test Cases Grid / List */}
      <div className="grid grid-cols-1 gap-3">
        {filteredTests.map((tc) => {
          const maxLatency = tc.expected_results.find((er) => er.max_latency_ms)?.max_latency_ms;

          return (
            <div
              key={tc.id}
              onClick={() => setActiveTest(tc)}
              className="bg-[#0b101a] hover:bg-[#0e1422] border border-slate-800 hover:border-cyan-500/50 rounded-lg p-4 transition-all cursor-pointer shadow-md group font-mono text-xs"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                <div className="flex items-center space-x-2.5">
                  <span className="font-bold text-cyan-400 text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                    {tc.id}
                  </span>
                  <CategoryBadge category={tc.category} />
                  <AsilBadge level={tc.asil_target} />
                  {tc.revised_by_critic && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-600/60 flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Critic Revised</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3 text-slate-400 text-[11px]">
                  {maxLatency && (
                    <span className="text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Deadline: ≤ {maxLatency}ms</span>
                    </span>
                  )}
                  <span className="text-slate-500">
                    {tc.steps.length} Steps • {tc.expected_results.length} Assertions
                  </span>
                  <span className="text-cyan-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center space-x-1">
                    <span>View Spec</span>
                    <Eye className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              <h4 className="text-sm font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                {tc.title}
              </h4>
              <p className="text-slate-400 text-xs mt-1 line-clamp-2 leading-relaxed">
                {tc.description}
              </p>

              {/* Step 1 Stimulus Preview */}
              {tc.steps[0] && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="truncate max-w-xl">
                    <span className="text-slate-500 mr-1.5">Action:</span>
                    <span>{tc.steps[0].action}</span>
                  </div>
                  {tc.steps[0].can_bus_injection && (
                    <span className="text-cyan-400/90 text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0 hidden sm:inline">
                      {tc.steps[0].can_bus_injection}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredTests.length === 0 && (
        <div className="p-8 text-center bg-[#0e1422] border border-slate-800 rounded-lg font-mono text-slate-400 text-xs">
          No test cases match the selected filter criteria.
        </div>
      )}

      {/* Test Case Details Modal / Drawer */}
      <TestCaseDrawer testCase={activeTest} onClose={() => setActiveTest(null)} />
    </div>
  );
};
