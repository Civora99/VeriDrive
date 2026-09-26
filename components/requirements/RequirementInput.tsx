'use client';

import React, { useState } from 'react';
import { DEMO_REQUIREMENTS } from '@/data/demo-requirements';
import { Cpu, Upload, Sparkles, BookOpen, AlertCircle } from 'lucide-react';
import { parseRequirementText } from '@/lib/parsing/text';

interface RequirementInputProps {
  onAnalyze: (rawText: string, reqId?: string) => Promise<void>;
  isLoading: boolean;
}

export const RequirementInput: React.FC<RequirementInputProps> = ({ onAnalyze, isLoading }) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(DEMO_REQUIREMENTS[0].id);
  const [textInput, setTextInput] = useState<string>(DEMO_REQUIREMENTS[0].raw_text);
  const [fileError, setFileError] = useState<string | null>(null);

  const handlePresetChange = (reqId: string) => {
    setSelectedPresetId(reqId);
    const found = DEMO_REQUIREMENTS.find((r) => r.id === reqId);
    if (found) {
      setTextInput(found.raw_text);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileText = await file.text();
      const parsed = parseRequirementText(fileText);
      setTextInput(parsed.cleanedText);
      setSelectedPresetId('');
    } catch (err: any) {
      setFileError('Failed to read uploaded file. Please paste the requirement text directly.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    onAnalyze(textInput, selectedPresetId || undefined);
  };

  return (
    <div className="bg-[#0e1422] border border-slate-800 rounded-lg p-5 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h2 className="font-mono text-base font-bold text-slate-100">
              Automotive Requirement Ingestion
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Select a synthetic OEM ECU specification or paste custom embedded vehicle requirements
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-slate-400 hidden sm:block" />
          <span className="text-xs font-mono text-slate-400 hidden sm:inline">Presets:</span>
          <select
            value={selectedPresetId}
            onChange={(e) => handlePresetChange(e.target.value)}
            disabled={isLoading}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono rounded px-3 py-1.5 focus:border-cyan-400 focus:outline-none"
          >
            {DEMO_REQUIREMENTS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id}: {r.ecu.split(' ')[0]} - {r.title.slice(0, 32)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-mono text-slate-300 font-semibold flex items-center space-x-2">
              <span>Software Requirement Specification (SRS / DOORS Text)</span>
            </label>
            <label className="cursor-pointer text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center space-x-1">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document (.txt, .md, .spec)</span>
              <input
                type="file"
                accept=".txt,.md,.json,.spec,.xml"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isLoading}
              />
            </label>
          </div>

          <textarea
            value={textInput}
            onChange={(e) => {
              setTextInput(e.target.value);
              setSelectedPresetId('');
            }}
            disabled={isLoading}
            rows={8}
            className="w-full bg-[#080c14] border border-slate-800 rounded p-3 text-xs font-mono text-slate-200 leading-relaxed focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none resize-y"
            placeholder="Paste automotive requirement text here (e.g. BMS, ADAS, EPB, CAN bus timeouts, ASIL timing)..."
          />
        </div>

        {fileError && (
          <div className="flex items-center space-x-2 p-2.5 rounded bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{fileError}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="text-[11px] font-mono text-slate-500">
            {textInput.split(/\s+/).filter(Boolean).length} words • ISO 26262 ASIL & Timing
            Parser Ready
          </div>

          <button
            type="submit"
            disabled={isLoading || !textInput.trim()}
            className="flex items-center space-x-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-mono text-xs font-bold rounded shadow-[0_0_15px_rgba(0,229,255,0.25)] transition-all"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Executing AI Extraction...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Extract & Analyze Requirement</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
