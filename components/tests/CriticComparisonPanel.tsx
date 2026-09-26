'use client';

import React from 'react';
import { CriticReview } from '@/lib/types/tests';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Zap,
  ArrowRight
} from 'lucide-react';

interface CriticComparisonPanelProps {
  review: CriticReview;
}

export const CriticComparisonPanel: React.FC<CriticComparisonPanelProps> = ({ review }) => {
  return (
    <div className="bg-[#0b101a] border border-cyan-900/60 rounded-lg p-5 shadow-2xl font-mono text-xs">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <span>Automotive Safety Critic: Independent Confirmation Review</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-600/40">
                ISO 26262 Part 4 Cl. 8
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Automated adversarial audit of generated test conditions, timing bounds & edge cases
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-3 py-1.5 rounded bg-slate-900 border border-slate-800 flex items-center space-x-2">
            <span className="text-slate-400">Rigor Rating:</span>
            <span className="text-emerald-400 font-bold">{review.rigor_rating}</span>
          </div>

          <div className="px-3 py-1.5 rounded bg-cyan-950 border border-cyan-600/40 flex items-center space-x-2">
            <span className="text-slate-300">Critic Score:</span>
            <span className="text-cyan-300 font-bold text-sm">{review.overall_score}/100</span>
          </div>
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="p-3 rounded bg-slate-950 border border-slate-800/90 text-center">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Original Tests</div>
          <div className="text-lg font-bold text-slate-300 mt-0.5">{review.original_test_count}</div>
        </div>
        <div className="p-3 rounded bg-slate-950 border border-emerald-900/40 text-center">
          <div className="text-[10px] text-emerald-400 uppercase tracking-wider">Revised Suite</div>
          <div className="text-lg font-bold text-emerald-400 mt-0.5">{review.revised_test_count}</div>
        </div>
        <div className="p-3 rounded bg-slate-950 border border-cyan-900/40 text-center">
          <div className="text-[10px] text-cyan-400 uppercase tracking-wider">Edge Cases Added</div>
          <div className="text-lg font-bold text-cyan-400 mt-0.5">+{review.added_tests_count}</div>
        </div>
        <div className="p-3 rounded bg-slate-950 border border-amber-900/40 text-center">
          <div className="text-[10px] text-amber-400 uppercase tracking-wider">Assertions Tightened</div>
          <div className="text-lg font-bold text-amber-400 mt-0.5">{review.refined_tests_count}</div>
        </div>
      </div>

      {/* Critique Summary */}
      <div className="p-3.5 rounded bg-slate-950 border border-slate-800/80 mb-4">
        <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">
          Safety Auditor Findings:
        </span>
        <p className="text-slate-200 text-xs leading-relaxed">{review.critique_summary}</p>
      </div>

      {/* Detailed Critic Audit Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Missing Coverage Resolved */}
        <div className="p-3.5 rounded bg-emerald-950/20 border border-emerald-900/40">
          <div className="flex items-center space-x-1.5 text-emerald-400 font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wider">Missing Corner Cases Identified & Injected:</span>
          </div>
          <ul className="space-y-1.5 list-disc list-inside text-slate-300 text-[11px] leading-relaxed">
            {review.missing_coverage_scenarios.map((sc, idx) => (
              <li key={idx} className="marker:text-emerald-500">
                {sc}
              </li>
            ))}
          </ul>
        </div>

        {/* Ambiguities Resolved */}
        <div className="p-3.5 rounded bg-amber-950/20 border border-amber-900/40">
          <div className="flex items-center space-x-1.5 text-amber-400 font-bold mb-2">
            <Zap className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wider">Vague Bounds Replaced with Strict Limits:</span>
          </div>
          <ul className="space-y-1.5 list-disc list-inside text-slate-300 text-[11px] leading-relaxed">
            {review.ambiguous_expected_results.map((am, idx) => (
              <li key={idx} className="marker:text-amber-500">
                {am}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommendations */}
      {review.recommendations.length > 0 && (
        <div className="mt-4 p-3 rounded bg-slate-900/60 border border-slate-800 flex items-start space-x-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-slate-300 font-bold uppercase text-[10px] tracking-wider block mb-0.5">
              HIL Integration Recommendations:
            </span>
            <div className="text-slate-400 text-[11px] space-y-0.5">
              {review.recommendations.map((rec, idx) => (
                <div key={idx}>• {rec}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
