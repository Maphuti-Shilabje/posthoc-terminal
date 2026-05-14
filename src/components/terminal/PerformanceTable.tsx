'use client';

import React from 'react';
import { usePerformanceSummary } from '@/hooks/usePerformanceSummary';

function MetricRow({ 
  label, 
  all, 
  long, 
  short, 
  isCurrency = false, 
  isPercent = false 
}: { 
  label: string, 
  all: number | null | undefined, 
  long: number | null | undefined, 
  short: number | null | undefined,
  isCurrency?: boolean,
  isPercent?: boolean
}) {
  const formatValue = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '-';
    let formatted = val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (isCurrency) formatted = `$${formatted}`;
    if (isPercent) formatted = `${formatted}%`;
    return formatted;
  };

  const getColorClass = (val: number | null | undefined) => {
    if (val === null || val === undefined) return 'text-gray-400';
    if (label.includes('Loss') || label.includes('Drawdown') || label.includes('Adverse')) return 'text-red-400';
    if (val > 0 && !label.includes('Total') && !label.includes('Ratio')) return 'text-emerald-400';
    if (val < 0) return 'text-red-400';
    return 'text-gray-200';
  };

  return (
    <div className="grid grid-cols-4 gap-4 py-2 border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors px-4">
      <div className="text-gray-500">{label}</div>
      <div className={`font-mono text-right ${getColorClass(all)}`}>{formatValue(all)}</div>
      <div className={`font-mono text-right ${getColorClass(long)}`}>{formatValue(long)}</div>
      <div className={`font-mono text-right ${getColorClass(short)}`}>{formatValue(short)}</div>
    </div>
  );
}

export function PerformanceTable() {
  const { summary, isLoading } = usePerformanceSummary();

  if (isLoading) {
    return <div className="p-4 text-gray-500 animate-pulse uppercase tracking-widest text-xs">Loading Performance Data...</div>;
  }

  if (!summary.all) {
    return <div className="p-4 text-gray-500 text-xs">No performance data available.</div>;
  }

  const { all, long, short } = summary;

  return (
    <div className="flex flex-col h-full bg-gray-950 rounded border border-gray-800 overflow-hidden font-mono text-[11px]">
      <div className="grid grid-cols-4 gap-4 p-3 border-b border-gray-800 bg-gray-900/50 font-bold uppercase tracking-wider text-gray-400">
        <div>Metric</div>
        <div className="text-right">All</div>
        <div className="text-right">Long</div>
        <div className="text-right">Short</div>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800">
        <MetricRow label="Net Profit" all={all?.netProfit} long={long?.netProfit} short={short?.netProfit} isCurrency />
        <MetricRow label="Gross Profit" all={all?.grossProfit} long={long?.grossProfit} short={short?.grossProfit} isCurrency />
        <MetricRow label="Gross Loss" all={all?.grossLoss} long={long?.grossLoss} short={short?.grossLoss} isCurrency />
        <MetricRow label="Max Drawdown" all={all?.maxDrawdown} long={long?.maxDrawdown} short={short?.maxDrawdown} isCurrency />
        
        <div className="h-4" /> {/* Spacer */}
        <div className="px-4 py-2 bg-gray-900/50 text-gray-400 font-bold uppercase tracking-wider text-[10px] border-y border-gray-800">Benchmark Comparison</div>
        <MetricRow label="Buy & hold return" all={summary.buyAndHoldReturnUSD} long={null} short={null} isCurrency />
        <MetricRow label="Buy & hold % gain" all={summary.buyAndHoldReturn} long={null} short={null} isPercent />
        <MetricRow label="Strategy outperformance" all={summary.strategyOutperformance} long={null} short={null} isCurrency />
        
        <div className="h-4" /> {/* Spacer */}
        <div className="px-4 py-2 bg-gray-900/50 text-gray-400 font-bold uppercase tracking-wider text-[10px] border-y border-gray-800">Risk-Adjusted Performance</div>
        <MetricRow label="Sharpe Ratio" all={all?.sharpeRatio} long={long?.sharpeRatio} short={short?.sharpeRatio} />
        <MetricRow label="Sortino Ratio" all={all?.sortinoRatio} long={long?.sortinoRatio} short={short?.sortinoRatio} />
        
        <div className="h-4" /> {/* Spacer */}
        
        <MetricRow label="Total Closed Trades" all={all?.totalTrades} long={long?.totalTrades} short={short?.totalTrades} />
        <MetricRow label="Percent Profitable" all={all?.percentProfitable} long={long?.percentProfitable} short={short?.percentProfitable} isPercent />
        <MetricRow label="Profit Factor" all={all?.profitFactor} long={long?.profitFactor} short={short?.profitFactor} />
        <MetricRow label="Ratio Avg Win / Loss" all={all?.ratioAvgWinLoss} long={long?.ratioAvgWinLoss} short={short?.ratioAvgWinLoss} />
        
        <div className="h-4" /> {/* Spacer */}
        
        <MetricRow label="Avg Trade" all={all?.avgTrade} long={long?.avgTrade} short={short?.avgTrade} isCurrency />
        <MetricRow label="Avg Winning Trade" all={all?.avgWin} long={long?.avgWin} short={short?.avgWin} isCurrency />
        <MetricRow label="Avg Losing Trade" all={all?.avgLoss} long={long?.avgLoss} short={short?.avgLoss} isCurrency />
        <MetricRow label="Largest Winning Trade" all={all?.largestWin} long={long?.largestWin} short={short?.largestWin} isCurrency />
        <MetricRow label="Largest Losing Trade" all={all?.largestLoss} long={long?.largestLoss} short={short?.largestLoss} isCurrency />
      </div>
    </div>
  );
}