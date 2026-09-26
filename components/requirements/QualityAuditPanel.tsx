'use client';

import React from 'react';
import { RequirementAnalysisResult } from '@/lib/types/requirements';
import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface QualityAuditPanelProps {
  audit: RequirementAnalysisResult;
}

export const QualityAuditPanel: React.FC<QualityAuditPanelProps> = ({ audit }) => {
  const { clarity_score, testability_score, rule_violations, completeness_assessment } = audit;

  return (
    <div className="bg-[#0e1422] border border-slate-800 rounded-lg p-5 shadow-lg font-mono text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-slate-100 uppercase tracking-wider text-sm">
            ISO 26262 Requirement Quality & Testability Audit
          </h3>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded bg-slate-900 border border-slate-700">
            <span className="text-slate-400">Clarity:</span>
            <span
              className={`font-bold ${
                clarity_score >= 80
                  ? 'text-emerald-400'
                  : clarity_score >= 60
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {clarity_score}%
            </span>
          </div>

          <div className="flex items-center space-x-2 px-2.5 py-1 rounded bg-slate-900 border border-slate-700">
            <span className="text-slate-400">Testability:</span>
            <span
              className={`font-bold ${
                testability_score >= 80
                  ? 'text-emerald-400'
                  : testability_score >= 60
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {testability_score}%
            </span>
          </div>
        </div>
      </div>

      {/* Completeness matrix */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
        <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center space-x-2">
          {completeness_assessment.has_timing ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <div>
            <div className="text-slate-300 font-semibold">Timing Deadlines</div>
            <div className="text-[10px] text-slate-500">
              {completeness_assessment.has_timing ? 'Explicit in ms' : 'Missing latency'}
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center space-x-2">
          {completeness_assessment.has_failure_handling ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <div>
            <div className="text-slate-300 font-semibold">Safe State Action</div>
            <div className="text-[10px] text-slate-500">
              {completeness_assessment.has_failure_handling ? 'Defined' : 'Missing fail-safe'}
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center space-x-2">
          {completeness_assessment.has_interfaces ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <div>
            <div className="text-slate-300 font-semibold">Bus Protocols</div>
            <div className="text-[10px] text-slate-500">
              {completeness_assessment.has_interfaces ? 'CAN/LIN/ETH' : 'Unspecified'}
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center space-x-2">
          {completeness_assessment.has_diagnostics ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <div>
            <div className="text-slate-300 font-semibold">UDS DTC / Freeze</div>
            <div className="text-[10px] text-slate-500">
              {completeness_assessment.has_diagnostics ? 'ISO 14229 linked' : 'No DTC mapped'}
            </div>
          </div>
        </div>
      </div>

      {/* Violations / Recommendations list */}
      {rule_violations.length > 0 ? (
        <div className="p-3 rounded bg-amber-950/20 border border-amber-900/40 space-y-1.5">
          <div className="flex items-center space-x-1.5 text-amber-400 font-bold text-xs mb-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Audit Findings & Ambiguity Mitigations:</span>
          </div>
          {rule_violations.map((violation, idx) => (
            <div key={idx} className="text-slate-300 text-[11px] flex items-start space-x-2">
              <span className="text-amber-500 font-bold">•</span>
              <span>{violation}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3 rounded bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Requirement fully satisfies INCOSE and ISO 26262 testability criteria.</span>
        </div>
      )}
    </div>
  );
};
