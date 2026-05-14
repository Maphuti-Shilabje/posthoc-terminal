'use client';

import React from 'react';
import { WeaknessInsight } from '@/hooks/useIntelligence';
import { AlertTriangle, Zap, Target, TrendingDown } from 'lucide-react';

interface IntelligencePanelProps {
  insights: WeaknessInsight[];
  isLoading: boolean;
}

export function IntelligencePanel({ insights, isLoading }: IntelligencePanelProps) {
  return (
    <div className="flex flex-col h-full font-mono text-[11px] p-4">
      <div className="space-y-3 overflow-y-auto pr-1">
        {insights.length === 0 && !isLoading && (
          <div className="text-gray-600 italic p-2 border border-dashed border-gray-800 rounded text-center">
            No significant weaknesses detected.
          </div>
        )}

        {insights.map((insight, idx) => (
          <div 
            key={idx} 
            className={`p-3 rounded border flex flex-col gap-2 ${
              insight.type === 'critical' ? 'bg-red-950/20 border-red-900/50' :
              insight.type === 'warning' ? 'bg-amber-950/20 border-amber-900/50' :
              'bg-blue-950/20 border-blue-900/50'
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {insight.type === 'critical' && <AlertTriangle size={14} className="text-red-500" />}
                {insight.type === 'warning' && <TrendingDown size={14} className="text-amber-500" />}
                {insight.type === 'info' && <Zap size={14} className="text-blue-500" />}
                <span className={`font-bold uppercase tracking-tight ${
                  insight.type === 'critical' ? 'text-red-400' :
                  insight.type === 'warning' ? 'text-amber-400' :
                  'text-blue-400'
                }`}>{insight.title}</span>
              </div>
              <div className="text-[10px] font-bold text-gray-400 bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800">
                {insight.metric}
              </div>
            </div>
            <p className="text-gray-400 leading-relaxed">
              {insight.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-800 shrink-0">
         <button className="w-full py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-gray-300 font-bold transition-colors flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest">
            <Target size={14} />
            Generate Full Audit Report
         </button>
      </div>
    </div>
  );
}