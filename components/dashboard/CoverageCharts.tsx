'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { CoverageMetrics } from '@/lib/validation/coverage';
import { BarChart3, PieChart, Activity } from 'lucide-react';

interface CoverageChartsProps {
  metrics: CoverageMetrics;
}

export const CoverageCharts: React.FC<CoverageChartsProps> = ({ metrics }) => {
  const categoryData = Object.entries(metrics.category_distribution).map(([category, count]) => ({
    category: category.replace('Communication-Loss', 'Comms').replace('Fault-Injection', 'Fault-Inj').replace('Cross-Component', 'Cross-Comp'),
    fullName: category,
    count
  }));

  const ecuData = metrics.ecu_breakdown.map((item) => ({
    ecu: item.ecu.split(' ')[0],
    coverage: item.coverage_pct,
    tests: item.test_count
  }));

  const categoryColors = [
    '#10b981', // Happy-Path
    '#3b82f6', // Boundary
    '#a855f7', // Negative
    '#f59e0b', // Timing
    '#ef4444', // Comms-Loss
    '#f43f5e', // Fault-Injection
    '#f97316', // Power-Cycle
    '#14b8a6', // Recovery
    '#6366f1', // Diagnostic
    '#06b6d4'  // Cross-Component
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 font-mono text-xs">
      {/* 10-Category Test Distribution Chart */}
      <div className="lg:col-span-7 bg-[#0e1422] border border-slate-800 rounded-lg p-5 shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2 text-cyan-400 font-bold">
            <BarChart3 className="w-4 h-4" />
            <span className="uppercase tracking-wider">10-Category Test Distribution</span>
          </div>
          <span className="text-[11px] text-slate-500">ISO 26262 Part 4 Mandate</span>
        </div>

        <div className="h-64 mt-4 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="category"
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                interval={0}
                angle={-30}
                textAnchor="end"
              />
              <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0b101a',
                  borderColor: '#334155',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontSize: '11px',
                  fontFamily: 'monospace'
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ECU Subsystem Coverage Rates */}
      <div className="lg:col-span-5 bg-[#0e1422] border border-slate-800 rounded-lg p-5 shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold">
              <Activity className="w-4 h-4" />
              <span className="uppercase tracking-wider">ECU Subsystem Coverage</span>
            </div>
            <span className="text-[11px] text-slate-500">Target: 100%</span>
          </div>

          <div className="space-y-4 mt-4">
            {metrics.ecu_breakdown.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-200">{item.ecu}</span>
                    <span className="text-[10px] text-slate-400 px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800">
                      {item.asil_level}
                    </span>
                  </div>
                  <span className="text-cyan-400 font-bold">
                    {item.coverage_pct}% ({item.test_count} tests)
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, item.coverage_pct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Overall System ASIL-D Conformance:</span>
          <span className="text-emerald-400 font-bold">{metrics.asil_d_coverage_pct}%</span>
        </div>
      </div>
    </div>
  );
};
