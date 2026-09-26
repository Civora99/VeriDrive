'use client';

import React from 'react';
import Link from 'next/link';
import { StructuredRequirement } from '@/lib/types/requirements';
import { AsilBadge } from '../shared/AsilBadge';
import {
  Layers,
  FileCode2,
  Play,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';

interface RecentRunsTableProps {
  requirements: StructuredRequirement[];
  testCounts: Record<string, number>;
  statusMap: Record<string, 'PASSED' | 'FAILED' | 'READY'>;
}

export const RecentRunsTable: React.FC<RecentRunsTableProps> = ({
  requirements,
  testCounts,
  statusMap
}) => {
  return (
    <div className="bg-[#0e1422] border border-slate-800 rounded-lg p-5 shadow-lg font-mono text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2 text-cyan-400 font-bold">
          <Layers className="w-4 h-4" />
          <span className="uppercase tracking-wider">Active ECU Requirements & Validation Status</span>
        </div>
        <Link
          href="/traceability"
          className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
        >
          <span>View Full Traceability Matrix</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto mt-3">
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-500 text-[10px] border-b border-slate-800 uppercase">
              <th className="pb-2">Requirement ID</th>
              <th className="pb-2">Specification Title</th>
              <th className="pb-2">ECU Subsystem</th>
              <th className="pb-2">ASIL</th>
              <th className="pb-2">Validation Suite</th>
              <th className="pb-2">Bench Result</th>
              <th className="pb-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-300">
            {requirements.map((req) => {
              const testCount = testCounts[req.id] || 0;
              const status = statusMap[req.id] || 'READY';

              return (
                <tr key={req.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3">
                    <span className="font-bold text-cyan-400">{req.id}</span>
                  </td>

                  <td className="py-3 max-w-sm">
                    <div className="truncate text-slate-200">{req.title}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {req.timing_constraints[0]
                        ? `Latency deadline: ≤ ${req.timing_constraints[0].max_latency_ms}ms`
                        : 'Functional safety requirement'}
                    </div>
                  </td>

                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                      {req.ecu.split(' ')[0]}
                    </span>
                  </td>

                  <td className="py-3">
                    <AsilBadge level={req.asil_level} />
                  </td>

                  <td className="py-3">
                    <span className="font-bold text-slate-200">{testCount} Tests</span>
                    <span className="text-[10px] text-slate-500 block">10 Categories</span>
                  </td>

                  <td className="py-3">
                    {status === 'PASSED' ? (
                      <span className="inline-flex items-center space-x-1 text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>PASSED</span>
                      </span>
                    ) : status === 'FAILED' ? (
                      <span className="inline-flex items-center space-x-1 text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/50">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>FAIL (DEFECT)</span>
                      </span>
                    ) : (
                      <span className="text-slate-500">READY</span>
                    )}
                  </td>

                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        href={`/tests?req=${encodeURIComponent(req.id)}`}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-semibold"
                      >
                        Tests
                      </Link>
                      <Link
                        href={`/execution?req=${encodeURIComponent(req.id)}`}
                        className="px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 font-semibold flex items-center space-x-1"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Run</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
