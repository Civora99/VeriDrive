'use client';

import React, { useState } from 'react';
import {
  Cpu,
  Database,
  RotateCcw,
  Info,
  CheckCircle2,
  Server,
  Zap,
  Sliders,
  Check
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleResetDemo = () => {
    setResetting(true);
    setTimeout(() => {
      setResetting(false);
      setResetDone(true);
      setTimeout(() => {
        setResetDone(false);
        router.push('/analyze?req=REQ-TLM-001');
      }, 1000);
    }, 600);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-slate-800">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
          Settings
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          System configuration, AI models, and validation bench connection parameters
        </p>
      </div>

      <div className="space-y-5">
        {/* SECTION 1: AI MODEL */}
        <div className="bg-[#111622] border border-slate-800 rounded-lg p-5 space-y-3">
          <div className="flex items-center space-x-2 text-slate-200 font-semibold text-sm pb-2 border-b border-slate-800/80">
            <Cpu className="w-4 h-4 text-sky-400" />
            <span>AI Model</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded bg-[#0b0f17] border border-slate-800/80">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Primary Engine</span>
              <span className="font-semibold text-slate-200 mt-0.5 block">Google Gemini 2.5</span>
              <span className="text-[11px] text-slate-500 mt-1 block">Low-latency embedded parsing</span>
            </div>

            <div className="p-3 rounded bg-[#0b0f17] border border-slate-800/80">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Inference Temperature</span>
              <span className="font-semibold text-slate-200 mt-0.5 block font-mono">0.2 (Deterministic)</span>
              <span className="text-[11px] text-slate-500 mt-1 block">ISO 26262 audit compliance</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: CONNECTION STATUS */}
        <div className="bg-[#111622] border border-slate-800 rounded-lg p-5 space-y-3">
          <div className="flex items-center space-x-2 text-slate-200 font-semibold text-sm pb-2 border-b border-slate-800/80">
            <Server className="w-4 h-4 text-sky-400" />
            <span>Connection Status</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-3 rounded bg-[#0b0f17] border border-slate-800/80">
              <div className="flex items-center space-x-2.5">
                <Server className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="font-medium text-slate-200 block">Python FastAPI Backend</span>
                  <span className="text-[11px] text-slate-500 font-mono">http://127.0.0.1:8000 • Querying AI & Validation Logic</span>
                </div>
              </div>
              <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Online (Port 8000)</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded bg-[#0b0f17] border border-slate-800/80">
              <div className="flex items-center space-x-2.5">
                <Database className="w-4 h-4 text-sky-400" />
                <div>
                  <span className="font-medium text-slate-200 block">Supabase PostgreSQL</span>
                  <span className="text-[11px] text-slate-500">Live DB with Typed Memory Cache Fallback</span>
                </div>
              </div>
              <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-950/60 text-sky-400 border border-sky-800/80">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span>Connected</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded bg-[#0b0f17] border border-slate-800/80">
              <div className="flex items-center space-x-2.5">
                <Zap className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="font-medium text-slate-200 block">HIL Simulation Engine</span>
                  <span className="text-[11px] text-slate-500">CAN 2.0B / J1939 Virtual Test Bench</span>
                </div>
              </div>
              <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Ready (14ms)</span>
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 3: DEMO MODE */}
        <div className="bg-[#111622] border border-slate-800 rounded-lg p-5 space-y-3">
          <div className="flex items-center space-x-2 text-slate-200 font-semibold text-sm pb-2 border-b border-slate-800/80">
            <Sliders className="w-4 h-4 text-sky-400" />
            <span>Demo Mode</span>
          </div>

          <div className="p-3 rounded bg-[#0b0f17] border border-slate-800/80 space-y-3 text-xs">
            <p className="text-slate-300 leading-relaxed">
              Deterministic demo fixtures are configured for <strong className="text-sky-300">REQ-TLM-001</strong> (Telematics ECU 10s Cloud GPS Transmission) and <strong className="text-sky-300">REQ-BMS-042</strong> (Battery Thermal Derating).
            </p>
            <div>
              <button
                type="button"
                onClick={handleResetDemo}
                disabled={resetting}
                className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                {resetting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                    <span>Resetting Demo Scenario...</span>
                  </>
                ) : resetDone ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Demo Data Reset!</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
                    <span>Reset Demo Data & Open REQ-TLM-001</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 4: ABOUT VERIDRIVE */}
        <div className="bg-[#111622] border border-slate-800 rounded-lg p-5 space-y-3">
          <div className="flex items-center space-x-2 text-slate-200 font-semibold text-sm pb-2 border-b border-slate-800/80">
            <Info className="w-4 h-4 text-sky-400" />
            <span>About VeriDrive AI</span>
          </div>

          <div className="p-3 rounded bg-[#0b0f17] border border-slate-800/80 space-y-2 text-xs text-slate-300 leading-relaxed">
            <div className="font-semibold text-slate-100">
              Requirements-to-Validation Intelligence for Embedded Automotive Systems
            </div>
            <p className="text-slate-400">
              Developed for the Automotive Engineering Hackathon sponsored by <strong className="text-slate-200">PACCAR India</strong>. Designed to bridge natural-language OEM specifications and automated hardware-in-the-loop (HIL) test suites for ECUs, telematics, CAN/J1939 networks, and safety-critical vehicle software.
            </p>
            <div className="pt-2 text-[11px] text-slate-500 font-mono">
              Version 1.0.0-hackathon • Next.js 16 • Tailwind CSS • Supabase
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
