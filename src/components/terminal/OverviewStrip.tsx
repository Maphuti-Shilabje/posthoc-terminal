'use client';

import React from 'react';
import { useStrategyMetrics } from '@/hooks/useStrategyMetrics';

function MetricBox({ title, value, subValue, isCurrency = false, isPositive = null }: { title: string, value: string | number, subValue?: string | number, isCurrency?: boolean, isPositive?: boolean | null }) {
  const displayValue = typeof value === 'number' ? (isCurrency ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })) : value;
  
  let colorClass = "text-gray-200";
  if (isPositive === true) colorClass = "text-emerald-400";
  if (isPositive === false) colorClass = "text-red-400";

  return (
    <div className="flex flex-col min-w-0 pr-4 border-r border-gray-800 last:border-0 last:pr-0 pl-4 first:pl-0">
      <span className="text-gray-500 text-[9px] uppercase font-bold tracking-wider truncate mb-1">{title}</span>
      <div className="flex items-baseline gap-2 truncate">
        <span className={`text-xl font-bold truncate ${colorClass}`}>{displayValue}</span>
        {subValue !== undefined && (
          <span className="text-[10px] text-gray-500 truncate">{subValue}</span>
        )}
      </div>
    </div>
  );
}

export function OverviewStrip() {
  const { metrics, isLoading } = useStrategyMetrics();

  if (isLoading) {
    return <div className="h-16 flex items-center px-4 bg-gray-950/50 border-b border-gray-800 text-gray-600 animate-pulse text-xs font-bold uppercase tracking-widest">Aggregating Metrics...</div>;
  }

  if (!metrics) {
    return <div className="h-16 flex items-center px-4 bg-gray-950/50 border-b border-gray-800 text-gray-600 text-xs">Upload dataset to view strategy metrics.</div>;
  }

  return (
    <div className="flex items-center overflow-x-auto bg-gray-950/50 border-b border-gray-800 p-4 scrollbar-thin scrollbar-thumb-gray-800">
      <div className="flex min-w-max">
        <MetricBox 
          title="Net Profit" 
          value={metrics.netProfit} 
          isCurrency 
          isPositive={metrics.netProfit > 0 ? true : (metrics.netProfit < 0 ? false : null)} 
        />
        <MetricBox 
          title="Total Closed Trades" 
          value={metrics.totalTrades} 
        />
        <MetricBox 
          title="Percent Profitable" 
          value={metrics.percentProfitable} 
          subValue="%" 
          isPositive={metrics.percentProfitable >= 50 ? true : false}
        />
        <MetricBox 
          title="Profit Factor" 
          value={metrics.profitFactor} 
          isPositive={metrics.profitFactor >= 1.5 ? true : (metrics.profitFactor < 1 ? false : null)}
        />
        <MetricBox 
          title="Max Drawdown" 
          value={metrics.maxDrawdown} 
          isCurrency 
          isPositive={false}
        />
        <MetricBox 
          title="Avg Trade" 
          value={metrics.avgTrade} 
          isCurrency 
          isPositive={metrics.avgTrade > 0 ? true : (metrics.avgTrade < 0 ? false : null)}
        />
        <MetricBox 
          title="Avg # Bars in Trade" 
          value={metrics.avgBarsInTrade} 
        />
      </div>
    </div>
  );
}