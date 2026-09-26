import React from 'react';
import { TestCategory } from '@/lib/types/tests';

interface CategoryBadgeProps {
  category: TestCategory | string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  const styles: Record<string, string> = {
    'Happy-Path': 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50',
    Boundary: 'bg-blue-950/60 text-blue-300 border-blue-700/50',
    Negative: 'bg-purple-950/60 text-purple-300 border-purple-700/50',
    Timing: 'bg-amber-950/60 text-amber-300 border-amber-700/50',
    'Communication-Loss': 'bg-red-950/60 text-red-300 border-red-700/50',
    'Fault-Injection': 'bg-rose-950/60 text-rose-300 border-rose-700/50',
    'Power-Cycle': 'bg-orange-950/60 text-orange-300 border-orange-700/50',
    Recovery: 'bg-teal-950/60 text-teal-300 border-teal-700/50',
    Diagnostic: 'bg-indigo-950/60 text-indigo-300 border-indigo-700/50',
    'Cross-Component': 'bg-cyan-950/60 text-cyan-300 border-cyan-700/50'
  };

  const currentStyle = styles[category] || 'bg-slate-900 text-slate-300 border-slate-700';

  return (
    <span
      className={`inline-flex items-center text-[11px] font-mono font-medium px-2 py-0.5 rounded border ${currentStyle}`}
    >
      {category}
    </span>
  );
};
