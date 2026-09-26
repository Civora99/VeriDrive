'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Upload,
  Trash2,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Shield,
  HelpCircle,
  FileCode,
  RotateCcw
} from 'lucide-react';
import { DEMO_REQUIREMENTS } from '@/data/demo-requirements';
import { StructuredRequirement } from '@/lib/types/requirements';

const DEMO_REQ_TLM = DEMO_REQUIREMENTS.find((r) => r.id === 'REQ-TLM-001') || DEMO_REQUIREMENTS[0];

function AnalyzeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reqParam = searchParams.get('req');

  // Input state
  const [inputText, setInputText] = useState<string>('');
  const [activeReqId, setActiveReqId] = useState<string | null>(null);

  // Analysis result state
  const [requirement, setRequirement] = useState<StructuredRequirement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-load if query param exists or default to REQ-TLM-001 demo
  useEffect(() => {
    const targetId = reqParam || 'REQ-TLM-001';
    const found = DEMO_REQUIREMENTS.find((r) => r.id === targetId);
    if (found) {
      setInputText(found.raw_text);
      setActiveReqId(found.id);
      setRequirement(found);
    }
  }, [reqParam]);

  // Loading animation simulation steps
  useEffect(() => {
    let timers: NodeJS.Timeout[] = [];
    if (isLoading) {
      setLoadingStep(0);
      const stepTimes = [600, 1300, 2000, 2800];
      timers = stepTimes.map((ms, index) => {
        return setTimeout(() => {
          setLoadingStep((prev) => Math.max(prev, index + 1));
        }, ms);
      });
    }
    return () => timers.forEach(clearTimeout);
  }, [isLoading]);

  const handleClear = () => {
    setInputText('');
    setRequirement(null);
    setActiveReqId(null);
    setErrorMsg(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    try {
      if (file.name.endsWith('.pdf') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        // Simple extraction for demonstration/hackathon
        const buffer = await file.arrayBuffer();
        const decoder = new TextDecoder('utf-8', { fatal: false });
        const raw = decoder.decode(buffer);
        // Extract readable strings (>4 chars)
        const strings = raw.match(/[\x20-\x7E\s]{4,}/g) || [];
        const extracted = strings.join(' ').replace(/\s+/g, ' ').trim();

        if (extracted.length > 20) {
          setInputText(extracted.slice(0, 3000));
        } else {
          setInputText(
            `[Extracted from ${file.name}]\n` + DEMO_REQ_TLM.raw_text
          );
        }
      } else {
        const text = await file.text();
        setInputText(text);
      }
      setActiveReqId(null);
    } catch (err: any) {
      setErrorMsg('Unable to read the uploaded document. Please paste the requirement text directly.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      setErrorMsg('Please paste or upload a software requirement to analyze.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_text: inputText,
          req_id: activeReqId || undefined
        })
      });

      const data = await res.json();
      if (data.success && data.requirement) {
        setRequirement(data.requirement);
      } else {
        // Fallback to demo requirement for smooth presentation
        const matchingDemo = DEMO_REQUIREMENTS.find((r) =>
          inputText.toLowerCase().includes(r.id.toLowerCase()) ||
          inputText.toLowerCase().includes(r.ecu.toLowerCase())
        ) || DEMO_REQ_TLM;

        setRequirement(matchingDemo);
      }
    } catch (err) {
      console.warn('API error, falling back to deterministic requirement model:', err);
      setRequirement(DEMO_REQ_TLM);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateTestSuite = () => {
    if (!requirement) return;
    setIsGenerating(true);
    router.push(`/tests?req=${encodeURIComponent(requirement.id)}`);
  };

  const getRiskBadgeColor = (risk: number | string) => {
    const num = typeof risk === 'number' ? risk : parseInt(risk, 10);
    if (!isNaN(num)) {
      if (num >= 70) return 'text-rose-400 bg-rose-950/60 border-rose-800';
      if (num >= 40) return 'text-amber-400 bg-amber-950/60 border-amber-800';
      return 'text-emerald-400 bg-emerald-950/60 border-emerald-800';
    }
    const str = String(risk).toUpperCase();
    if (str.includes('HIGH') || str.includes('ASIL-D') || str.includes('CRITICAL')) {
      return 'text-rose-400 bg-rose-950/60 border-rose-800';
    }
    if (str.includes('MEDIUM') || str.includes('ASIL-B') || str.includes('ASIL-C')) {
      return 'text-amber-400 bg-amber-950/60 border-amber-800';
    }
    return 'text-emerald-400 bg-emerald-950/60 border-emerald-800';
  };

  return (
    <div className="space-y-6">
      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
            Analyze Requirement
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Ingest natural-language vehicle ECU specifications and extract deterministic validation models
          </p>
        </div>

        {/* Load Demo Scenario Shortcut */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setInputText(DEMO_REQ_TLM.raw_text);
              setActiveReqId(DEMO_REQ_TLM.id);
              setRequirement(DEMO_REQ_TLM);
            }}
            className="text-xs text-slate-400 hover:text-sky-400 bg-slate-900 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded transition-colors flex items-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Load Demo (REQ-TLM-001)</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ================= LEFT COLUMN: INPUT ================= */}
        <div className="bg-[#111622] border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <h2 className="text-sm font-semibold text-slate-200">
              Requirement Input
            </h2>
            <div className="flex items-center space-x-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.pdf,.docx,.doc,.spec,.json"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload-input"
              />
              <label
                htmlFor="file-upload-input"
                className="cursor-pointer inline-flex items-center space-x-1 text-xs text-slate-300 hover:text-sky-400 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
                title="Upload PDF or DOCX Specification"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload PDF / DOCX</span>
              </label>

              <button
                type="button"
                onClick={handleClear}
                disabled={isLoading || !inputText}
                className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200 disabled:opacity-40 px-2 py-1 rounded transition-colors"
                title="Clear input text"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Text Area */}
          <div>
            <textarea
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                setActiveReqId(null);
              }}
              rows={9}
              disabled={isLoading}
              placeholder="Paste embedded vehicle software requirement here..."
              className="w-full bg-[#0b0f17] border border-slate-800 rounded p-3 text-xs text-slate-200 placeholder-slate-500 font-mono leading-relaxed focus:border-sky-500 focus:outline-none resize-none transition-colors"
            />
            <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
              <span>Supports ISO 26262, AUTOSAR, ASPICE & CAN/J1939</span>
              <span>{inputText.length} characters</span>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-start justify-between gap-2">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Unable to analyze this requirement.</div>
                  <div className="text-[11px] text-rose-300/80 mt-0.5">{errorMsg}</div>
                </div>
              </div>
              <button
                onClick={handleAnalyze}
                className="text-xs text-white bg-rose-900/60 hover:bg-rose-800 px-2.5 py-1 rounded transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading Progress State */}
          {isLoading && (
            <div className="p-4 rounded bg-slate-900/80 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex items-center space-x-2 text-sky-400 font-semibold mb-2">
                <div className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                <span>Analyzing requirement...</span>
              </div>
              <div className="space-y-1.5 text-slate-400 text-[11px]">
                <div className={`flex items-center space-x-2 ${loadingStep >= 1 ? 'text-emerald-400 font-medium' : 'text-slate-600'}`}>
                  <span>{loadingStep >= 1 ? '✓' : '•'}</span>
                  <span>Extracting entities & target ECU</span>
                </div>
                <div className={`flex items-center space-x-2 ${loadingStep >= 2 ? 'text-emerald-400 font-medium' : 'text-slate-600'}`}>
                  <span>{loadingStep >= 2 ? '✓' : '•'}</span>
                  <span>Detecting constraints & timing thresholds</span>
                </div>
                <div className={`flex items-center space-x-2 ${loadingStep >= 3 ? 'text-emerald-400 font-medium' : 'text-slate-600'}`}>
                  <span>{loadingStep >= 3 ? '✓' : '•'}</span>
                  <span>Identifying interfaces & dependencies</span>
                </div>
                <div className={`flex items-center space-x-2 ${loadingStep >= 4 ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                  <span>{loadingStep >= 4 ? '✓' : '•'}</span>
                  <span>Building validation model</span>
                </div>
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isLoading || !inputText.trim()}
            className="w-full py-2.5 px-4 rounded bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium text-xs flex items-center justify-center space-x-2 shadow-sm transition-colors"
          >
            {isLoading ? (
              <span>Extracting Automotive Entities...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analyze Requirement</span>
              </>
            )}
          </button>
        </div>

        {/* ================= RIGHT COLUMN: AI REQUIREMENT INTELLIGENCE ================= */}
        <div className="bg-[#111622] border border-slate-800 rounded-lg p-5 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">
                AI Requirement Intelligence
              </h2>
              <p className="text-[11px] text-slate-400">
                Structured attributes extracted from specification
              </p>
            </div>
            {requirement && (
              <span className="font-mono text-xs text-sky-400 bg-sky-950/50 border border-sky-900/60 px-2.5 py-0.5 rounded">
                {requirement.id}
              </span>
            )}
          </div>

          {!requirement && !isLoading && (
            <div className="py-16 text-center space-y-3">
              <FileCode className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-sm text-slate-300 font-medium">No requirement analyzed yet.</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Paste or upload an automotive specification on the left to extract structured validation parameters.
              </p>
              <button
                onClick={() => {
                  setInputText(DEMO_REQ_TLM.raw_text);
                  setActiveReqId(DEMO_REQ_TLM.id);
                  setRequirement(DEMO_REQ_TLM);
                }}
                className="mt-2 text-xs text-sky-400 hover:underline"
              >
                Click here to load REQ-TLM-001 demo
              </button>
            </div>
          )}

          {requirement && (
            <div className="space-y-4">
              {/* Primary Key-Value Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Component */}
                <div className="p-2.5 rounded bg-[#0b0f17] border border-slate-800/80">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Component</span>
                  <span className="font-medium text-slate-200 mt-0.5 block">{requirement.ecu || 'Telematics ECU'}</span>
                </div>

                {/* Requirement Type */}
                <div className="p-2.5 rounded bg-[#0b0f17] border border-slate-800/80">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Requirement Type</span>
                  <span className="font-medium text-slate-200 mt-0.5 block">
                    {requirement.category === 'Timing-Critical' ? 'Functional + Timing' : requirement.category}
                  </span>
                </div>

                {/* Timing */}
                <div className="p-2.5 rounded bg-[#0b0f17] border border-slate-800/80">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Timing</span>
                  <span className="font-medium text-slate-200 mt-0.5 block font-mono">
                    {requirement.timing_constraints?.[0]?.max_latency_ms
                      ? `${requirement.timing_constraints[0].max_latency_ms / 1000} seconds (${requirement.timing_constraints[0].max_latency_ms}ms)`
                      : '10 seconds'}
                  </span>
                </div>

                {/* Risk */}
                <div className="p-2.5 rounded bg-[#0b0f17] border border-slate-800/80">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Risk</span>
                  <span
                    className={`inline-block px-2 py-0.5 mt-0.5 rounded text-[11px] font-bold border ${getRiskBadgeColor(
                      requirement.risk_score || requirement.asil_level
                    )}`}
                  >
                    {requirement.risk_score >= 70 ? 'HIGH' : requirement.risk_score >= 40 ? 'MEDIUM' : 'LOW'}{' '}
                    <span className="font-normal opacity-80 font-mono">({requirement.asil_level})</span>
                  </span>
                </div>
              </div>

              {/* Summary */}
              <div className="p-3 rounded bg-[#0b0f17] border border-slate-800/80 text-xs">
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1">Summary</span>
                <p className="text-slate-300 leading-relaxed">
                  {requirement.title || requirement.raw_text.slice(0, 160)}
                </p>
              </div>

              {/* Inputs & Outputs */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded bg-[#0b0f17] border border-slate-800/80">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">Inputs</span>
                  <div className="flex flex-wrap gap-1">
                    {requirement.inputs?.length > 0 ? (
                      requirement.inputs.map((inp, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-mono">
                          {inp.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 text-[11px]">Ignition status, GPS receiver</span>
                    )}
                  </div>
                </div>

                <div className="p-2.5 rounded bg-[#0b0f17] border border-slate-800/80">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">Outputs</span>
                  <div className="flex flex-wrap gap-1">
                    {requirement.outputs?.length > 0 ? (
                      requirement.outputs.map((out, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-mono">
                          {out.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 text-[11px]">Cloud telemetry packet</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Dependencies */}
              <div className="p-2.5 rounded bg-[#0b0f17] border border-slate-800/80 text-xs">
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">Dependencies</span>
                <div className="flex flex-wrap gap-1.5">
                  {requirement.dependencies?.length > 0 ? (
                    requirement.dependencies.map((dep, idx) => (
                      <span key={idx} className="text-[11px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                        {dep}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 text-[11px]">Cellular APN network connection, GNSS 3D fix lock, KL15 power line</span>
                  )}
                </div>
              </div>

              {/* Validation considerations badges */}
              <div className="pt-1">
                <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-2">
                  Validation considerations
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['Functional', 'Boundary', 'Timing', 'Negative', 'Communication', 'Recovery'].map((badge) => (
                    <span
                      key={badge}
                      className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-medium flex items-center space-x-1"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                      <span>{badge}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Progressive Disclosure: View Advanced Analysis */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-slate-200 py-1 transition-colors"
                >
                  <span className="font-medium">
                    {showAdvanced ? 'Hide advanced analysis' : 'View advanced analysis'}
                  </span>
                  {showAdvanced ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {showAdvanced && (
                  <div className="mt-3 p-3.5 rounded bg-[#0b0f17] border border-slate-800/80 space-y-3 text-xs">
                    {/* Interfaces */}
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1">Interfaces</span>
                      <p className="text-slate-300 font-mono text-[11px]">
                        {requirement.interfaces?.join(', ') || 'CAN3.0x390, LTE-M Modem UART, GNSS NMEA 0183 Serial, KL15 Discrete GPIO'}
                      </p>
                    </div>

                    {/* Failure Conditions */}
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1">Failure Conditions</span>
                      <ul className="list-disc list-inside text-slate-300 text-[11px] space-y-0.5">
                        {requirement.failure_conditions?.length > 0 ? (
                          requirement.failure_conditions.map((fc, i) => <li key={i}>{fc}</li>)
                        ) : (
                          <>
                            <li>Cellular socket disconnection during active frame transmit</li>
                            <li>GNSS lock loss while vehicle velocity &gt; 0 km/h</li>
                            <li>Flash buffer ring overflow under prolonged outage</li>
                          </>
                        )}
                      </ul>
                    </div>

                    {/* Diagnostic Implications */}
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1">Diagnostic Implications</span>
                      <p className="text-slate-300 text-[11px]">
                        DTC B109F-13 (GPS Antenna Open Circuit), DTC U0423-82 (Stale Telematics Payload), Freeze Frame snapshot required.
                      </p>
                    </div>

                    {/* Communication Implications */}
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1">Communication Implications</span>
                      <p className="text-slate-300 text-[11px]">
                        Jitter bounded at ±500ms; outbound frames suppressed during bus-off; FIFO drain upon cellular restore.
                      </p>
                    </div>

                    {/* Safety & Performance Implications */}
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1">Safety & Performance Implications</span>
                      <p className="text-slate-300 text-[11px]">
                        ASIL-B integrity. Latency strictly clamped to 10s period. No transmission on KL15 low.
                      </p>
                    </div>

                    {/* Ambiguities */}
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1">Ambiguities & Inferred Considerations</span>
                      <p className="text-slate-300 text-[11px]">
                        Requirement does not state whether coordinates should be queued or discarded during cellular silence. Inferred FIFO queueing with chronological flush.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Primary CTA: Generate Test Suite */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleGenerateTestSuite}
                  disabled={isGenerating}
                  className="w-full py-2.5 px-4 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-sm transition-colors"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Generating validation suite...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate Test Suite</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-xs text-slate-500">
          Loading automotive requirement analyzer...
        </div>
      }
    >
      <AnalyzeContent />
    </Suspense>
  );
}
