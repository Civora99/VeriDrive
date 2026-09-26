'use client';

import React, { useState } from 'react';
import { StructuredRequirement } from '@/lib/types/requirements';
import { TestCase, SuiteExecutionSummary } from '@/lib/types/tests';
import { AsilBadge } from '../shared/AsilBadge';
import { CategoryBadge } from '../shared/CategoryBadge';
import {
  Network,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Filter,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';

interface TraceabilityMatrixProps {
  requirements: StructuredRequirement[];
  testCases: TestCase[];
  executions: Record<string, SuiteExecutionSummary>;
}

export const TraceabilityMatrix: React.FC<TraceabilityMatrixProps> = ({
  requirements,
  testCases,
  executions
}) => {
  const [selectedEcu, setSelectedEcu] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  const ecus = ['All', ...Array.from(new Set(requirements.map((r) => r.ecu.split(' ')[0])))];

  // Group tests by requirement
  const matrixData = requirements.map((req) => {
    const tests = testCases.filter((tc) => tc.req_id === req.id);
    const execution = executions[req.id];
    const failedCount = execution?.failed || 0;
    const passedCount = execution?.passed || 0;

    let status = 'Uncovered';
    if (tests.length >= 8) {
      status = failedCount > 0 ? 'Failed_Validation' : 'Fully_Covered';
    } else if (tests.length > 0) {
      status = 'Partially_Covered';
    }

    return {
      req,
      tests,
      execution,
      status,
      failedCount,
      passedCount
    };
  });

  const filteredData = matrixData.filter((item) => {
    if (selectedEcu !== 'All' && !item.req.ecu.includes(selectedEcu)) return false;
    if (selectedStatus !== 'All' && item.status !== selectedStatus) return false;
    return true;
  });

  const handleExportCsv = () => {
    const headers = ['Requirement_ID', 'Title', 'ECU', 'ASIL_Level', 'Test_Count', 'Status', 'Failing_Tests'];
    const rows = filteredData.map((d) => [
      d.req.id,
      `"${d.req.title.replace(/"/g, '""')}"`,
      d.req.ecu.split(' ')[0],
      d.req.asil_level,
      d.tests.length,
      d.status,
      d.failedCount
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VeriDrive_ISO26262_Traceability_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header Controls */}
      <div className="bg-[#0e1422] border border-slate-800 rounded-lg p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2.5">
              <Network className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-slate-100">
                Bidirectional Traceability Matrix (RTM)
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                ISO 26262 Part 8 Cl. 9
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Complete forward and backward traceability: Requirements ↔ Test Cases ↔ HIL Results ↔ Defects
            </p>
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-2 px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export RTM to CSV</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
          <div className="flex items-center space-x-3">
            <span className="text-slate-400">ECU Filter:</span>
            <div className="flex items-center space-x-1">
              {ecus.map((ecu) => (
                <button
                  key={ecu}
                  onClick={() => setSelectedEcu(ecu)}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    selectedEcu === ecu
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {ecu}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-slate-400">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-3 py-1 focus:border-cyan-400 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Fully_Covered">Fully Covered</option>
              <option value="Failed_Validation">Failed Validation (Defect)</option>
              <option value="Partially_Covered">Partially Covered</option>
              <option value="Uncovered">Uncovered</option>
            </select>
          </div>
        </div>
      </div>

      {/* Traceability Table */}
      <div className="bg-[#0b101a] border border-slate-800 rounded-lg overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/80 text-slate-400 text-[11px] border-b border-slate-800">
                <th className="py-3 px-4">Requirement ID & Spec</th>
                <th className="py-3 px-4">Target ECU</th>
                <th className="py-3 px-4">ASIL</th>
                <th className="py-3 px-4">Validation Suite Mapping</th>
                <th className="py-3 px-4">Verification Method</th>
                <th className="py-3 px-4">HIL Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredData.map(({ req, tests, execution, status, failedCount }) => (
                <tr key={req.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-bold text-cyan-400 text-xs">{req.id}</div>
                    <div className="text-slate-200 truncate mt-0.5">{req.title}</div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="text-slate-300 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                      {req.ecu.split(' ')[0]}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <AsilBadge level={req.asil_level} />
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      <span className="font-bold text-slate-200">{tests.length} Tests</span>
                      <span className="text-slate-500">
                        (
                        {tests
                          .slice(0, 3)
                          .map((t) => t.category.slice(0, 4))
                          .join(', ')}
                        {tests.length > 3 ? '...' : ''})
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      Vector CANoe / HIL
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    {status === 'Fully_Covered' ? (
                      <span className="inline-flex items-center space-x-1.5 text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>100% Passed</span>
                      </span>
                    ) : status === 'Failed_Validation' ? (
                      <span className="inline-flex items-center space-x-1.5 text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/50">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{failedCount} Defect Found</span>
                      </span>
                    ) : status === 'Partially_Covered' ? (
                      <span className="inline-flex items-center space-x-1.5 text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Partial Suite</span>
                      </span>
                    ) : (
                      <span className="text-slate-500">Uncovered</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/tests?req=${encodeURIComponent(req.id)}`}
                      className="inline-flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 font-bold"
                    >
                      <span>Tests</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
