'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Settings, ShieldCheck, CheckCircle2, RotateCcw } from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  const navLinks = [
    { href: '/analyze', label: 'Analyze' },
    { href: '/tests', label: 'Test Suite' },
    { href: '/traceability', label: 'Traceability' },
    { href: '/validation', label: 'Validation' },
    { href: '/settings', label: 'Settings' }
  ];

  const handleLoadDemo = () => {
    router.push('/analyze?req=REQ-TLM-001');
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0e131d] border-b border-slate-800 text-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left: Brand */}
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 group-hover:border-sky-500 transition-colors">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex items-baseline space-x-1.5">
                <span className="font-semibold text-sm tracking-wide text-slate-100">
                  VeriDrive <span className="text-sky-400 font-bold">AI</span>
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  • Automotive Validation
                </span>
              </div>
            </Link>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-800 text-sky-400 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Indicators and Demo Mode */}
          <div className="flex items-center space-x-3 text-xs">
            {/* Connection Indicator */}
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>HIL Engine: Online</span>
            </div>

            {/* Demo Mode Button / Badge */}
            <button
              onClick={handleLoadDemo}
              title="Load REQ-TLM-001 Demo Scenario"
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors text-[11px]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              <span className="font-medium">DEMO MODE</span>
              <span className="text-slate-500 hidden sm:inline ml-1">(REQ-TLM-001)</span>
            </button>

            {/* Settings Icon */}
            <Link
              href="/settings"
              className={`p-1.5 rounded transition-colors ${
                pathname === '/settings'
                  ? 'bg-slate-800 text-sky-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title="Platform Settings"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
