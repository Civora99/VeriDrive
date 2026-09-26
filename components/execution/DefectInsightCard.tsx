'use client';

import React from 'react';
import { TestDefect } from '@/lib/types/tests';
import { ShieldAlert, AlertTriangle, Bug, Wrench, ArrowRight, CheckCircle2 } from 'lucide-react';

interface DefectInsightCardProps {
  defect: TestDefect;
}

export const DefectInsightCard: React.FC<DefectInsightCardProps> = ({ defect }) => {
  return (
    <div className="bg-[#130d12] border-2 border-rose-600/70 rounded-lg p-5 shadow-[0_0_20px_rgba(244,63,94,0.2)] font-mono text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-900/40">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded bg-rose-950 border border-rose-600/80 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-rose-300 text-xs px-2 py-0.5 rounded bg-rose-950/80 border border-rose-800">
                {defect.id}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-900 text-rose-200 border border-rose-600">
                {defect.severity}
              </span>
            </div>
            <h3 className="text-sm font-bold text-rose-100 mt-1">{defect.summary}</h3>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-[10px] text-slate-400">Target ECU & Test:</div>
          <div className="text-rose-300 font-bold">
            {defect.ecu.split(' ')[0]} • {defect.test_case_id}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {/* Root Cause Analysis */}
        <div className="p-3.5 rounded bg-[#1f0f18] border border-rose-900/60">
          <div className="flex items-center space-x-2 text-rose-400 font-bold mb-1.5 uppercase text-[11px] tracking-wider">
            <Bug className="w-3.5 h-3.5" />
            <span>Firmware / Architecture Root Cause Analysis</span>
          </div>
          <p className="text-slate-200 text-xs leading-relaxed">{defect.root_cause}</p>
        </div>

        {/* CAN Bus Discrepancy & Actual vs Expected */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 rounded bg-slate-950 border border-slate-800">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">
              CAN Bus & Signal Discrepancy:
            </span>
            <div className="text-amber-300 font-mono text-[11px] bg-slate-900 p-2 rounded border border-slate-800">
              {defect.can_discrepancy}
            </div>
          </div>

          <div className="p-3 rounded bg-slate-950 border border-slate-800">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">
              Actual vs Expected Safety Violation:
            </span>
            <div className="text-rose-300 font-mono text-[11px] bg-slate-900 p-2 rounded border border-slate-800">
              {defect.actual_vs_expected}
            </div>
          </div>
        </div>

        {/* Recommended Fix */}
        <div className="p-3.5 rounded bg-emerald-950/20 border border-emerald-900/50">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold mb-1.5 uppercase text-[11px] tracking-wider">
            <Wrench className="w-3.5 h-3.5" />
            <span>Recommended OEM / Tier-1 Firmware Remediation</span>
          </div>
          <p className="text-slate-300 text-xs leading-relaxed">{defect.recommended_fix}</p>
        </div>
      </div>
    </div>
  );
};
