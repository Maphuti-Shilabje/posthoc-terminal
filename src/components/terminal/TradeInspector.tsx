'use client';

import React, { useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';
import { useGlobalStore } from '@/engine/state';
import { useTradeDNA } from '@/hooks/useTradeDNA';
import { useTrades } from '@/hooks/useTrades';
import { Trade } from '@/types/contracts';

export function TradeInspector() {
  const selectedTradeId = useGlobalStore((state) => state.selectedTradeId);
  const plotRef = useRef<HTMLDivElement>(null);
  const { tradeDetails, signals, isLoading: isDNALoading } = useTradeDNA(selectedTradeId);
  const { trades } = useTrades();

  useEffect(() => {
    if (!tradeDetails || !plotRef.current || trades.length === 0) return;

    const plot = Plot.plot({
      width: 280,
      height: 160,
      style: {
        background: 'transparent',
        color: '#9ca3af',
        fontSize: '10px',
        fontFamily: 'monospace',
      },
      marks: [
        Plot.dot(trades.filter((t) => t.status === 'executed'), {
          x: "mae",
          y: "mfe",
          fill: (d: Trade) => d.pnl_raw > 0 ? "#10b981" : "#ef4444",
          fillOpacity: 0.3,
          r: 2
        }),
        Plot.dot([tradeDetails], {
          x: "mae",
          y: "mfe",
          stroke: "#fbbf24", // amber-400
          fill: "transparent",
          strokeWidth: 2,
          r: 6
        }),
        Plot.ruleY([0]),
        Plot.ruleX([0])
      ],
      x: { label: "MAE (Adverse Excursion)", grid: true },
      y: { label: "MFE (Favorable Excursion)", grid: true }
    });

    plotRef.current.innerHTML = '';
    plotRef.current.appendChild(plot);

    return () => plot.remove();
  }, [tradeDetails, trades]);

  if (!selectedTradeId) {
    return (
      <div className="p-4 text-gray-500 h-full flex items-center justify-center text-center">
        Select a trade from the ledger to view its forensic DNA.
      </div>
    );
  }

  if (isDNALoading) {
    return <div className="p-4 text-emerald-500">Querying DNA Snapshot...</div>;
  }

  if (!tradeDetails) {
    return <div className="p-4 text-red-500">Trade not found in database.</div>;
  }

  const isWin = tradeDetails.pnl_raw > 0;
  const isRejected = tradeDetails.status === 'rejected';

  return (
    <div className="flex flex-col h-full overflow-y-auto font-mono text-[11px] divide-y divide-gray-800">
      
      {/* Header Block */}
      <div className="p-4 bg-gray-900 shrink-0">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="text-gray-400 mb-1">Trade ID</div>
            <div className="text-gray-200 text-xs font-bold">{tradeDetails.trade_id.slice(0, 12)}</div>
          </div>
          <div className={`px-2 py-1 rounded font-bold ${
            isRejected ? 'bg-gray-800 text-gray-400' :
            isWin ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'
          }`}>
            {isRejected ? 'REJECTED' : tradeDetails.direction.toUpperCase()}
          </div>
        </div>
        
        {isRejected && (
          <div className="mt-3 p-2 bg-red-950/30 border border-red-900 rounded text-red-400">
            <span className="font-bold">Kill Switch: </span>
            {tradeDetails.rejection_reason || 'Unknown Filter'}
          </div>
        )}
      </div>

      {/* Excursion DNA (MAE/MFE) */}
      <div className="p-4 shrink-0">
        <div className="text-gray-500 font-bold mb-3 uppercase tracking-wider text-[10px]">Excursion DNA</div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-950 p-3 rounded border border-gray-800">
            <div className="text-gray-500 mb-1">MFE (Peak Favorable)</div>
            <div className="text-emerald-400 font-bold text-sm">
              {tradeDetails.mfe ? '+' + tradeDetails.mfe.toFixed(2) : '-'}
            </div>
          </div>
          
          <div className="bg-gray-950 p-3 rounded border border-gray-800">
            <div className="text-gray-500 mb-1">MAE (Peak Adverse)</div>
            <div className="text-red-400 font-bold text-sm">
              {tradeDetails.mae ? '-' + tradeDetails.mae.toFixed(2) : '-'}
            </div>
          </div>
        </div>
        
        {!isRejected && (
          <div className="mt-3 bg-gray-950 p-3 rounded border border-gray-800 flex justify-between items-center">
            <div className="text-gray-500">Realized PnL</div>
            <div className={`font-bold text-sm ${isWin ? 'text-emerald-400' : 'text-red-400'}`}>
              {isWin ? '+' : ''}{tradeDetails.pnl_raw?.toFixed(2)}
            </div>
          </div>
        )}

        <div className="mt-4 min-w-0">
          <div className="text-gray-500 font-bold mb-2 uppercase tracking-wider text-[10px]">Trade Efficiency Scatter</div>
          <div className="bg-gray-950 p-2 rounded border border-gray-800 min-h-[160px] w-full overflow-x-auto min-w-0">
             <div className="min-w-max min-h-full flex items-center justify-center" ref={plotRef}>
               {(!trades || trades.length === 0) && <span className="text-gray-600">Loading scatter...</span>}
             </div>
          </div>
        </div>
      </div>

      {/* Signal Matrix */}
      <div className="p-4 flex-1">
        <div className="text-gray-500 font-bold mb-3 uppercase tracking-wider text-[10px]">Factor & Signal Matrix</div>
        
        {signals.length === 0 ? (
          <div className="text-gray-600 italic">No signal metadata available. Upload signals.csv.</div>
        ) : (
          <div className="space-y-2">
            {signals.map((sig, idx) => {
              // Determine if value crossed threshold
              const isBreach = sig.factor_threshold !== null && sig.factor_value > sig.factor_threshold;
              
              return (
                <div key={idx} className="flex justify-between items-center bg-gray-950 p-2 rounded border border-gray-800">
                  <div className="flex flex-col">
                    <span className="text-gray-300 font-bold">{sig.factor_name}</span>
                    {sig.factor_threshold !== null && (
                      <span className="text-gray-600 text-[9px]">Threshold: {sig.factor_threshold}</span>
                    )}
                  </div>
                  <div className={`font-bold ${isBreach ? 'text-amber-400' : 'text-gray-400'}`}>
                    {sig.factor_value.toFixed(4)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}