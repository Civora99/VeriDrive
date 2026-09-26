'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Upload, Sparkles, FileText, CheckCircle2, ChevronRight } from 'lucide-react';
import { parseRequirementText } from '@/lib/parsing/text';

export default function HomePage() {
  const router = useRouter();
  const [requirementText, setRequirementText] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requirementText.trim()) {
      // Default to demo scenario if empty
      router.push('/analyze?req=REQ-TLM-001');
      return;
    }
    // Store in session or navigate with parameter
    sessionStorage.setItem('veridrive_custom_requirement', requirementText);
    router.push('/analyze?mode=custom');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const text = await file.text();
      const parsed = parseRequirementText(text);
      setRequirementText(parsed.cleanedText);
    } catch (err) {
      console.error('File read error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLoadDemo = () => {
    router.push('/analyze?req=REQ-TLM-001');
  };

  const recentAnalyses = [
    {
      id: 'REQ-TLM-001',
      component: 'Telematics Control Unit (TCU)',
      tests: 8,
      status: 'Verified'
    },
    {
      id: 'REQ-BMS-042',
      component: 'Battery Management System (BMS)',
      tests: 10,
      status: 'Verified'
    },
    {
      id: 'REQ-ACC-104',
      component: 'ADAS Domain Controller',
      tests: 9,
      status: 'Verified'
    }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-12 py-6">
      {/* Header & Value Proposition */}
      <div className="space-y-3">
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono bg-slate-900 border border-slate-800 text-sky-400">
          <span>VeriDrive AI</span>
          <span className="text-slate-600">•</span>
          <span>Requirements → Validation Intelligence</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
          Turn requirements into validation scenarios.
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
          Analyze embedded-vehicle software requirements, generate relevant test scenarios, identify
          coverage gaps, and trace validation results.
        </p>
      </div>

      {/* Primary Input Area */}
      <form onSubmit={handleAnalyze} className="space-y-3">
        <div className="relative">
          <textarea
            value={requirementText}
            onChange={(e) => setRequirementText(e.target.value)}
            rows={7}
            placeholder="Paste a software requirement here... (or click below to load the Telematics REQ-TLM-001 demo)"
            className="w-full bg-[#111622] border border-slate-800 rounded-lg p-4 text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500/70 focus:ring-1 focus:ring-sky-500/40 leading-relaxed resize-y transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center space-x-2">
            <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs transition-colors">
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span>{isUploading ? 'Reading file...' : 'Upload Specification'}</span>
              <input
                type="file"
                accept=".txt,.md,.json,.spec,.doc,.docx,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={handleLoadDemo}
              className="text-xs text-sky-400 hover:text-sky-300 font-medium px-2.5 py-1.5 rounded hover:bg-slate-900 transition-colors"
            >
              Load Demo Scenario (REQ-TLM-001)
            </button>
          </div>

          <button
            type="submit"
            className="inline-flex items-center space-x-2 px-5 py-2 rounded bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition-colors shadow-sm"
          >
            <span>Analyze Requirement</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Recent Analyses (Max 3 Rows) */}
      <div className="space-y-3 pt-4 border-t border-slate-900">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Recent Analyses</span>
          <span className="text-[11px] text-slate-600">PACCAR Hackathon Scope</span>
        </div>

        <div className="bg-[#111622] border border-slate-800/80 rounded-lg divide-y divide-slate-800/60 overflow-hidden">
          {recentAnalyses.map((item) => (
            <div
              key={item.id}
              onClick={() => router.push(`/analyze?req=${encodeURIComponent(item.id)}`)}
              className="px-4 py-3 flex items-center justify-between hover:bg-slate-800/40 cursor-pointer transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <span className="font-mono text-xs font-semibold text-sky-400 group-hover:text-sky-300">
                  {item.id}
                </span>
                <span className="text-xs text-slate-300">{item.component}</span>
              </div>

              <div className="flex items-center space-x-4">
                <span className="text-xs text-slate-400 font-mono">{item.tests} tests</span>
                <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/50">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{item.status}</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
