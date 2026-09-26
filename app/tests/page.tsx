'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TestCase, CriticReview } from '@/lib/types/tests';
import { StructuredRequirement } from '@/lib/types/requirements';
import { TestSuiteViewer } from '@/components/tests/TestSuiteViewer';
import { DEMO_REQUIREMENTS } from '@/data/demo-requirements';
import { DEMO_TEST_SUITES, DEMO_CRITIC_REVIEWS } from '@/data/demo-results';
import { FileCode2, Play, Sparkles, ArrowRight, ShieldCheck, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

function TestsContent() {
  const searchParams = useSearchParams();
  const reqId = searchParams.get('req') || 'REQ-BMS-042';

  const [requirement, setRequirement] = useState<StructuredRequirement | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [criticReview, setCriticReview] = useState<CriticReview | null>(null);
  const [isCriticLoading, setIsCriticLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const req = DEMO_REQUIREMENTS.find((r) => r.id === reqId) || DEMO_REQUIREMENTS[0];
      setRequirement(req);

      // Check if pre-cached or fetch
      try {
        const res = await fetch('/api/generate-tests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ req_id: reqId, requirement: req })
        });
        const data = await res.json();
        if (data.success && data.test_cases?.length > 0) {
          setTestCases(data.test_cases);
        } else {
          setTestCases(DEMO_TEST_SUITES[reqId] || DEMO_TEST_SUITES['REQ-BMS-042']);
        }
      } catch (err) {
        setTestCases(DEMO_TEST_SUITES[reqId] || DEMO_TEST_SUITES['REQ-BMS-042']);
      }

      // Check critic review
      if (DEMO_CRITIC_REVIEWS[reqId]) {
        setCriticReview(DEMO_CRITIC_REVIEWS[reqId]);
      } else {
        setCriticReview(null);
      }

      setIsLoading(false);
    }

    loadData();
  }, [reqId]);

  const handleRunCritic = async () => {
    if (!requirement || testCases.length === 0) return;
    setIsCriticLoading(true);

    try {
      const res = await fetch('/api/critic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          req_id: reqId,
          requirement,
          test_cases: testCases
        })
      });

      const data = await res.json();
      if (data.success && data.critic_review) {
        setCriticReview(data.critic_review);
        if (data.revised_test_cases) {
          setTestCases(data.revised_test_cases);
        }
      }
    } catch (err) {
      console.error('Critic execution error:', err);
    } finally {
      setIsCriticLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800 font-mono">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Link
              href={`/analyze?req=${encodeURIComponent(reqId)}`}
              className="text-slate-400 hover:text-slate-200 flex items-center space-x-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back to Analysis</span>
            </Link>
            <span>•</span>
            <FileCode2 className="w-4 h-4" />
            <span>Phase 2 • Validation Suite & Critic Review</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-1">
            Automotive Test Suite & Adversarial Critic
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href={`/execution?req=${encodeURIComponent(reqId)}`}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Simulate HIL Bench</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="p-16 text-center bg-[#0e1422] border border-slate-800 rounded-lg font-mono text-slate-400 text-xs">
          <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Generating 10-category automotive validation suite for {reqId}...
        </div>
      ) : (
        <TestSuiteViewer
          reqId={reqId}
          testCases={testCases}
          criticReview={criticReview}
          onRunCritic={handleRunCritic}
          isCriticLoading={isCriticLoading}
        />
      )}
    </div>
  );
}

export default function TestsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center font-mono text-slate-400 text-xs">
          Loading test suite...
        </div>
      }
    >
      <TestsContent />
    </Suspense>
  );
}
