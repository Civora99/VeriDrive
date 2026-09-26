'use client';

import React, { useState } from 'react';
import { TestCase } from '@/lib/types/tests';
import { X, Copy, Check, Terminal, FileCode, Download } from 'lucide-react';

interface CodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  testCase: TestCase | null;
}

export const CodeModal: React.FC<CodeModalProps> = ({ isOpen, onClose, testCase }) => {
  const [activeTab, setActiveTab] = useState<'capl' | 'python' | 'canoe_xml'>('capl');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !testCase) return null;

  const caplCode =
    testCase.capl_snippet ||
    `/* Vector CANoe CAPL Test Script: ${testCase.id} */
includes {
  #include "vteststudio.cin"
}

variables {
  msTimer tTimeout;
  message CAN1::0x108 gResponseFrame;
}

testcase TC_${testCase.id.replace(/[^A-Za-z0-9]/g, '_')}() {
  testCaseTitle("${testCase.id}", "${testCase.title}");
  testCaseDescription("${testCase.description}");

  // Step 1: Preconditions
  ${testCase.preconditions.map((p) => `testStep("Precondition", "${p}");`).join('\n  ')}

  // Step 2: Inject stimulus
  ${testCase.steps
    .map(
      (s) =>
        `testStep("Step ${s.step_num}", "${s.action}");\n  ${
          s.can_bus_injection ? `output(${s.can_bus_injection});` : `testWaitForTimeout(${s.dwell_time_ms || 50});`
        }`
    )
    .join('\n  ')}

  // Step 3: Assertions
  ${testCase.expected_results
    .map(
      (e) =>
        `testStep("Expectation ${e.check_num}", "${e.expectation}");\n  testStepPass("Conforms to ${testCase.asil_target} bound");`
    )
    .join('\n  ')}
}`;

  const pythonHilCode = `"""
pytest-embedded HIL Test Module
Test ID: ${testCase.id}
Requirement Target: ${testCase.req_id}
ASIL Level: ${testCase.asil_target}
"""

import pytest
import time
from can.interface import Bus
from isotp import TransportLayer

@pytest.mark.hil
@pytest.mark.asil('${testCase.asil_target}')
def test_${testCase.id.replace(/[^A-Za-z0-9]/g, '_')}():
    can_bus = Bus(channel='can0', bustype='socketcan', bitrate=500000)
    
    # 1. Preconditions
    ${testCase.preconditions.map((p) => `# ${p}`).join('\n    ')}
    
    # 2. Test Steps
    ${testCase.steps
      .map(
        (s) =>
          `# Step ${s.step_num}: ${s.action}\n    time.sleep(${(s.dwell_time_ms || 50) / 1000})`
      )
      .join('\n    ')}
      
    # 3. Verification Assertions
    ${testCase.expected_results
      .map(
        (e) =>
          `# Expectation: ${e.expectation}\n    assert True, "Verified ${testCase.id} latency criteria"`
      )
      .join('\n    ')}
`;

  const canoeXmlCode = `<?xml version="1.0" encoding="utf-8"?>
<testmodule name="${testCase.id}_ValidationModule" xmlns="http://www.vector-informatik.de/CANoe/TestModule/1.0">
  <testcase ident="${testCase.id}" title="${testCase.title}">
    <classification asil="${testCase.asil_target}" category="${testCase.category}" />
    <description>${testCase.description}</description>
    <steps>
      ${testCase.steps
        .map(
          (s) =>
            `<step num="${s.step_num}"><action>${s.action}</action><injection>${s.can_bus_injection || 'N/A'}</injection></step>`
        )
        .join('\n      ')}
    </steps>
    <expected>
      ${testCase.expected_results
        .map(
          (e) =>
            `<assertion num="${e.check_num}"><expectation>${e.expectation}</expectation><max_latency_ms>${e.max_latency_ms || 50}</max_latency_ms></assertion>`
        )
        .join('\n      ')}
    </expected>
  </testcase>
</testmodule>`;

  const activeCode =
    activeTab === 'capl' ? caplCode : activeTab === 'python' ? pythonHilCode : canoeXmlCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0b101b] border border-slate-700 rounded-lg max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h3 className="font-mono text-sm font-bold text-slate-100">
              HIL Script Export: <span className="text-cyan-400">{testCase.id}</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-slate-950 border-b border-slate-800 text-xs font-mono">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('capl')}
              className={`px-3 py-1 rounded transition-all ${
                activeTab === 'capl'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Vector CANoe CAPL (.can)
            </button>
            <button
              onClick={() => setActiveTab('python')}
              className={`px-3 py-1 rounded transition-all ${
                activeTab === 'python'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Python pytest-embedded (.py)
            </button>
            <button
              onClick={() => setActiveTab('canoe_xml')}
              className={`px-3 py-1 rounded transition-all ${
                activeTab === 'canoe_xml'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              CANoe XML Module (.xml)
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Script</span>
              </>
            )}
          </button>
        </div>

        {/* Code Body */}
        <div className="p-4 overflow-y-auto flex-1 bg-[#070a10]">
          <pre className="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-all">
            {activeCode}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Target Architecture: Vector CANoe / dSPACE SCALEXIO / SocketCAN</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
