'use client';

import React from 'react';
import { StructuredRequirement } from '@/lib/types/requirements';
import { AsilBadge } from '../shared/AsilBadge';
import {
  Clock,
  Radio,
  AlertTriangle,
  ArrowRightLeft,
  Wrench,
  ShieldAlert,
  Flame,
  CheckCircle
} from 'lucide-react';

interface RequirementCardProps {
  requirement: StructuredRequirement;
}

export const RequirementCard: React.FC<RequirementCardProps> = ({ requirement }) => {
  return (
    <div className="bg-[#0e1422] border border-slate-800 rounded-lg overflow-hidden shadow-xl">
      {/* Header Banner */}
      <div className="p-5 border-b border-slate-800 bg-slate-900/40">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center space-x-2.5">
            <span className="font-mono text-sm font-bold px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-cyan-400">
              {requirement.id}
            </span>
            <AsilBadge level={requirement.asil_level} size="md" />
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-slate-800/80 text-slate-300 border border-slate-700">
              {requirement.ecu}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-3 py-1 rounded bg-slate-950 border border-slate-800 font-mono text-xs">
              <span className="text-slate-400">Risk Index:</span>
              <span
                className={`font-bold ${
                  requirement.risk_score >= 85
                    ? 'text-rose-400'
                    : requirement.risk_score >= 70
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {requirement.risk_score}/100
              </span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1 rounded bg-slate-950 border border-slate-800 font-mono text-xs">
              <span className="text-slate-400">AI Confidence:</span>
              <span className="text-cyan-400 font-bold">{requirement.confidence_score}%</span>
            </div>
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-100 mt-1">{requirement.title}</h3>
      </div>

      <div className="p-5 space-y-6 text-xs font-mono">
        {/* Timing Constraints (Crucial for Embedded Auto) */}
        <div>
          <div className="flex items-center space-x-2 text-amber-400 font-bold mb-2.5">
            <Clock className="w-4 h-4" />
            <span className="uppercase tracking-wider">Deterministic Timing Constraints</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {requirement.timing_constraints.map((tc, idx) => (
              <div
                key={idx}
                className="p-3 rounded bg-[#090d16] border border-amber-900/40 flex flex-col justify-between"
              >
                <div>
                  <div className="text-slate-300 font-semibold">{tc.metric}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{tc.notes || 'Strict deadline'}</div>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Max Latency:</span>
                  <span className="text-amber-300 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-700/50">
                    ≤ {tc.max_latency_ms} ms
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inputs & Outputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Inputs */}
          <div className="p-3.5 rounded bg-[#090d16] border border-slate-800">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold mb-2">
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span className="uppercase tracking-wider">Sensory Inputs & CAN Frames</span>
            </div>
            <div className="space-y-2">
              {requirement.inputs.map((inp, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded bg-slate-900/60 border border-slate-800/80 flex items-start justify-between gap-2"
                >
                  <div>
                    <div className="text-slate-200 font-semibold">{inp.name}</div>
                    <div className="text-[10px] text-slate-400">{inp.description}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                      {inp.type}
                    </span>
                    {inp.interface_bus && (
                      <div className="text-[10px] text-slate-500 mt-1">{inp.interface_bus}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Outputs */}
          <div className="p-3.5 rounded bg-[#090d16] border border-slate-800">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold mb-2">
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span className="uppercase tracking-wider">Actuator Commands & Bus Broadcasts</span>
            </div>
            <div className="space-y-2">
              {requirement.outputs.map((out, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded bg-slate-900/60 border border-slate-800/80 flex items-start justify-between gap-2"
                >
                  <div>
                    <div className="text-slate-200 font-semibold">{out.name}</div>
                    <div className="text-[10px] text-slate-400">{out.description}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300 border border-slate-700">
                      {out.type}
                    </span>
                    {out.interface_bus && (
                      <div className="text-[10px] text-slate-500 mt-1">{out.interface_bus}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Triggers & Operational Conditions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 rounded bg-[#090d16] border border-slate-800">
            <div className="flex items-center space-x-2 text-rose-400 font-bold mb-2">
              <Flame className="w-3.5 h-3.5" />
              <span className="uppercase tracking-wider">State Transition Triggers</span>
            </div>
            <ul className="space-y-1.5 list-disc list-inside text-slate-300 text-[11px] leading-relaxed">
              {requirement.triggers.map((t, idx) => (
                <li key={idx} className="marker:text-rose-500">
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3.5 rounded bg-[#090d16] border border-slate-800">
            <div className="flex items-center space-x-2 text-blue-400 font-bold mb-2">
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="uppercase tracking-wider">Operational Design Domain / Conditions</span>
            </div>
            <ul className="space-y-1.5 list-disc list-inside text-slate-300 text-[11px] leading-relaxed">
              {requirement.conditions.map((c, idx) => (
                <li key={idx} className="marker:text-blue-500">
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Safety & Diagnostic Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Safety Goals */}
          <div className="p-3.5 rounded bg-rose-950/20 border border-rose-900/40">
            <div className="flex items-center space-x-2 text-rose-400 font-bold mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="uppercase tracking-wider">ISO 26262 Safety-Critical Goals</span>
            </div>
            <ul className="space-y-1 text-slate-300 text-[11px] leading-relaxed">
              {requirement.safety_related_wording.map((sw, idx) => (
                <li key={idx} className="p-1.5 rounded bg-rose-950/40 border border-rose-900/30">
                  {sw}
                </li>
              ))}
            </ul>
          </div>

          {/* Diagnostic Implications */}
          <div className="p-3.5 rounded bg-indigo-950/20 border border-indigo-900/40">
            <div className="flex items-center space-x-2 text-indigo-400 font-bold mb-2">
              <Wrench className="w-3.5 h-3.5" />
              <span className="uppercase tracking-wider">ISO 14229 UDS Diagnostics & DTCs</span>
            </div>
            <div className="space-y-2">
              {requirement.diagnostic_implications.map((diag, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded bg-indigo-950/40 border border-indigo-900/30 flex items-center justify-between"
                >
                  <div>
                    <span className="text-indigo-300 font-bold">{diag.dtc_code || 'DTC Pending'}</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">{diag.description}</p>
                  </div>
                  {diag.freeze_frame_required && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-900 text-indigo-200 border border-indigo-700">
                      Freeze Frame Required
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interfaces & Bus Protocols */}
        <div className="p-3 rounded bg-[#090d16] border border-slate-800 flex flex-wrap items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] mr-2">
            Target Interfaces:
          </span>
          {requirement.interfaces.map((iface, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[11px]"
            >
              {iface}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
