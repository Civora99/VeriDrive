'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { StructuredRequirement, RequirementAnalysisResult } from '@/lib/types/requirements';
import { RequirementInput } from '@/components/requirements/RequirementInput';
import { RequirementCard } from '@/components/requirements/RequirementCard';
import { QualityAuditPanel } from '@/components/requirements/QualityAuditPanel';
import { DEMO_REQUIREMENTS } from '@/data/demo-requirements';
import { evaluateRequirementQuality } from '@/lib/validation/requirementRules';
import { Sparkles, ArrowRight, FileCode2, Cpu, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

function AnalyzeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialReqId = searchParams.get('req');

  const [isLoading, setIsLoading] = useState(false);
  const [requirement, setRequirement] = useState<StructuredRequirement | null>(null);
  const [qualityAudit, setQualityAudit] = useState<RequirementAnalysisResult | null>(null);
  const [isGeneratingTests, setIsGeneratingTests] = useState(false);

  // Load preset if specified in query or default to BMS
  useEffect(() => {
    const targetId = initialReqId || 'REQ-BMS-042';
    const found = DEMO_REQUIREMENTS.find((r) => r.id === targetId) || DEMO_REQUIREMENTS[0];
    if (found) {
      setRequirement(found);
      setQualityAudit(evaluateRequirementQuality(found));
    }
  }, [initialReqId]);

  const handleAnalyze = async (rawText: string, reqId?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: rawText, req_id: reqId })
      });

      const data = await res.json();
      if (data.success && data.requirement) {
        setRequirement(data.requirement);
        setQualityAudit(data.quality);
      }
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSuite = async () => {
    if (!requirement) return;
    setIsGeneratingTests(true);

    try {
      const res = await fetch('/api/generate-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirement })
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/tests?req=${encodeURIComponent(requirement.id)}`);
      }
    } catch (e) {
      console.error('Test generation error:', e);
      router.push(`/tests?req=${encodeURIComponent(requirement.id)}`);
    } finally {
      setIsGeneratingTests(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800 font-mono">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            <span>Phase 1 • Requirements Engineering & Extraction</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-1">
            Automotive Software Requirement Analysis
          </h1>
        </div>

        {requirement && (
          <button
            onClick={handleGenerateSuite}
            disabled={isGeneratingTests}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all"
          >
            {isGeneratingTests ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Generating 10-Category Suite...</span>
              </>
            ) : (
              <>
                <FileCode2 className="w-4 h-4" />
                <span>Generate Validation Suite</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Input Section */}
      <RequirementInput onAnalyze={handleAnalyze} isLoading={isLoading} />

      {/* Structured Card Section */}
      {requirement && (
        <div className="space-y-6">
          <RequirementCard requirement={requirement} />

          {qualityAudit && <QualityAuditPanel audit={qualityAudit} />}

          {/* Bottom Next Step Bar */}
          <div className="p-4 rounded-lg bg-[#0e1422] border border-cyan-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
            <div className="flex items-center space-x-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                Requirement structured: <strong className="text-cyan-300">{requirement.id}</strong> (
                {requirement.ecu}) • Ready for validation test synthesis.
              </span>
            </div>

            <button
              onClick={handleGenerateSuite}
              disabled={isGeneratingTests}
              className="inline-flex items-center space-x-2 px-5 py-2 rounded bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 font-bold shadow-md transition-all shrink-0"
            >
              <span>Generate 10-Category Validation Suite</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center font-mono text-slate-400 text-xs">
          Loading requirement analysis engine...
        </div>
      }
    >
      <AnalyzeContent />
    </Suspense>
  );
}
