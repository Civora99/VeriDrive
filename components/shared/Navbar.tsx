'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Cpu,
  FileCode2,
  CheckCircle2,
  Network,
  PlaySquare,
  Activity,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: Activity },
    { href: '/analyze', label: 'Requirement Analysis', icon: Cpu },
    { href: '/tests', label: 'Validation Suite', icon: FileCode2 },
    { href: '/traceability', label: 'Traceability Matrix', icon: Network },
    { href: '/execution', label: 'HIL Simulation & Defects', icon: PlaySquare }
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Tag */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 rounded bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 transition-all shadow-[0_0_12px_rgba(0,229,255,0.2)]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-mono text-base font-bold tracking-wider text-slate-100">
                    VERI<span className="text-cyan-400">DRIVE</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    AI
                  </span>
                </div>
                <p className="text-[10px] font-mono text-slate-400 tracking-tight">
                  AUTOMOTIVE EMBEDDED VALIDATION
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 font-mono text-xs">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded transition-all ${
                    isActive
                      ? 'bg-slate-800/80 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Status Indicators & CTA */}
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800 text-[11px] font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
              <span className="text-slate-400">SIL/HIL BENCH:</span>
              <span className="text-emerald-400 font-semibold">SYNCHRONIZED</span>
            </div>

            <Link
              href="/analyze"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-[0_0_15px_rgba(0,229,255,0.3)]"
            >
              <span>Analyze Requirement</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
