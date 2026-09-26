import React from 'react';
import { AsilLevel } from '@/lib/types/requirements';

interface AsilBadgeProps {
  level: AsilLevel | string;
  size?: 'sm' | 'md' | 'lg';
}

export const AsilBadge: React.FC<AsilBadgeProps> = ({ level, size = 'sm' }) => {
  const normalized = (level || 'QM').toUpperCase();

  const colorMap: Record<string, string> = {
    'ASIL-D': 'bg-rose-950/70 text-rose-300 border-rose-600/60 shadow-[0_0_8px_rgba(244,63,94,0.3)]',
    'ASIL-C': 'bg-amber-950/70 text-amber-300 border-amber-600/60 shadow-[0_0_8px_rgba(245,158,11,0.25)]',
    'ASIL-B': 'bg-cyan-950/70 text-cyan-300 border-cyan-600/60 shadow-[0_0_8px_rgba(6,182,212,0.2)]',
    'ASIL-A': 'bg-blue-950/70 text-blue-300 border-blue-600/50',
    QM: 'bg-slate-900 text-slate-400 border-slate-700'
  };

  const styleClass = colorMap[normalized] || colorMap['QM'];

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 font-mono tracking-wider',
    md: 'text-xs px-2.5 py-1 font-mono tracking-wider',
    lg: 'text-sm px-3 py-1.5 font-mono tracking-wider'
  };

  return (
    <span
      className={`inline-flex items-center font-bold uppercase rounded border ${styleClass} ${sizeClasses[size]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current animate-pulse opacity-80" />
      {normalized}
    </span>
  );
};
