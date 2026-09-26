'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  FileCode2,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface DashboardKpiCardsProps {
  totalReqs: number;
  totalTests: number;
  coveragePct: number;
  highRiskCount: number;
  failedTestsCount: number;
  uncoveredCount: number;
}

export const DashboardKpiCards: React.FC<DashboardKpiCardsProps> = ({
  totalReqs,
  totalTests,
  coveragePct,
  highRiskCount,
  failedTestsCount,
  uncoveredCount
}) => {
  return (
    <div className="space-y-4">
      {/* Primary Action Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0d1627] via-[#0b1424] to-[#080d17] border border-cyan-500/40 rounded-lg p-6 shadow-2xl">
        <div className="absolute right-0 top-0 w-96 h-full bg-cyan-500/5 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Automotive Embedded Requirements-to-Validation Engine</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-mono">
              VeriDrive AI Validation Platform
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Autonomous extraction of ECU requirements into 10-category ISO 26262 validation test
              suites with adversarial AI Critic review, HIL simulation, and defect root cause
              insights.
            </p>
          </div>

          <Link
            href="/analyze"
            className="shrink-0 inline-flex items-center space-x-2.5 px-6 py-3 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-sm font-bold shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all hover:scale-105"
          >
            <span>Analyze Requirement</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
        {/* Requirements */}
        <div className="p-4 rounded-lg bg-[#0e1422] border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Requirements</span>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-2">{totalReqs}</div>
          <div className="text-[10px] text-slate-500 mt-1">Structured Specs</div>
        </div>

        {/* Test Cases */}
        <div className="p-4 rounded-lg bg-[#0e1422] border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Test Cases</span>
            <FileCode2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400 mt-2">{totalTests}</div>
          <div className="text-[10px] text-slate-500 mt-1">10 Auto Categories</div>
        </div>

        {/* AI Coverage */}
        <div className="p-4 rounded-lg bg-[#0e1422] border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>AI Coverage</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{coveragePct}%</div>
          <div className="text-[10px] text-slate-500 mt-1">ISO 26262 ASIL-D</div>
        </div>

        {/* High Risk Requirements */}
        <div className="p-4 rounded-lg bg-[#0e1422] border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>High Risk Reqs</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{highRiskCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">ASIL-D / &lt;30ms</div>
        </div>

        {/* Failed Tests */}
        <div className="p-4 rounded-lg bg-[#0e1422] border border-rose-900/50 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Failed Tests</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-2">{failedTestsCount}</div>
          <div className="text-[10px] text-rose-400/80 mt-1">Defect Detected</div>
        </div>

        {/* Uncovered Scenarios */}
        <div className="p-4 rounded-lg bg-[#0e1422] border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Uncovered Gaps</span>
            <AlertTriangle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-200 mt-2">{uncoveredCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">All Target Met</div>
        </div>
      </div>
    </div>
  );
};
