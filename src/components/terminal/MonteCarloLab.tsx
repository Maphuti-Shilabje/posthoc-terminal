'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useGlobalStore } from '@/engine/state';
import { queryDuckDB } from '@/engine/duckdb';
import * as Plot from '@observablehq/plot';
import { MonteCarloOutput } from '@/workers/montecarlo';
import { RawTrade } from '@/types/contracts';

export function MonteCarloLab() {
  const activeDatasetId = useGlobalStore((state) => state.activeDatasetId);
  const filters = useGlobalStore((state) => state.filters);
  const setMCMetrics = useGlobalStore((state) => state.setMCMetrics);
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResults, setSimResults] = useState<MonteCarloOutput | null>(null);
  const plotContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeDatasetId) return;

    const runSimulation = async () => {
      setIsSimulating(true);
      setMCMetrics({ isSimulating: true });
      try {
        let query = `
          SELECT t.pnl_raw 
          FROM trades t
          JOIN candles c ON t.entry_time = c.timestamp
          WHERE t.status = 'executed' AND t.pnl_raw IS NOT NULL
        `;

        const conditions = [];
        if (filters.session) conditions.push(`c.session = '${filters.session}'`);
        if (filters.regime) conditions.push(`c.regime = '${filters.regime}'`);
        if (filters.strategyId) conditions.push(`t.strategy_id = '${filters.strategyId}'`);
        
        if (conditions.length > 0) {
          query += ` AND ${conditions.join(' AND ')}`;
        }

        const trades = await queryDuckDB<RawTrade>(query);
        
        const pnlArray = trades.map((t) => t.pnl_raw);

        if (pnlArray.length === 0) {
          setSimResults(null);
          setIsSimulating(false);
          setMCMetrics({ isSimulating: false, medianDD: null, p95DD: null });
          return;
        }

        const worker = new Worker(new URL('../../workers/montecarlo.ts', import.meta.url));
        
        worker.onmessage = (e: MessageEvent<MonteCarloOutput | { error: string }>) => {
          if ('error' in e.data) {
            console.error("Worker Error:", e.data.error);
            setMCMetrics({ isSimulating: false });
          } else {
            setSimResults(e.data);
            
            const sorted = [...e.data.maxDrawdowns].sort((a,b) => a - b);
            const p95 = sorted[Math.floor(sorted.length * 0.95)];
            const median = sorted[Math.floor(sorted.length * 0.50)];
            
            setMCMetrics({ 
              isSimulating: false, 
              medianDD: median, 
              p95DD: p95 
            });
          }
          setIsSimulating(false);
          worker.terminate();
        };

        // 10,000 bootstrapped paths
        worker.postMessage({
          trades: pnlArray,
          iterations: 10000,
          tradesPerRun: Math.min(pnlArray.length, 500) 
        });

      } catch (err) {
        console.error("Monte Carlo simulation error:", err);
        setIsSimulating(false);
        setMCMetrics({ isSimulating: false });
      }
    };

    runSimulation();
  }, [activeDatasetId, filters.session, filters.regime, filters.strategyId, setMCMetrics]);

  useEffect(() => {
    if (!simResults || !plotContainerRef.current) return;

    const drawdowns = simResults.maxDrawdowns;

    const plot = Plot.plot({
      width: 280,
      height: 140,
      style: {
        background: 'transparent',
        color: '#9ca3af',
        fontSize: '10px',
        fontFamily: 'monospace',
      },
      marks: [
        Plot.rectY(drawdowns, {
          ...Plot.binX({ y: "count" }, { x: (d: number) => d }),
          fill: "#ef4444",
          fillOpacity: 0.6,
          inset: 0.5,
        }),
        Plot.ruleY([0])
      ],
      x: { label: "Max Drawdown ($)", ticks: 4 },
      y: { label: "Frequency", ticks: 3 }
    });

    plotContainerRef.current.innerHTML = '';
    plotContainerRef.current.appendChild(plot);

    return () => plot.remove();
  }, [simResults]);

  if (!activeDatasetId) {
    return <div className="text-gray-600 italic">Upload dataset to view simulations.</div>;
  }

  return (
    <div className="flex flex-col h-full font-mono text-[11px]">
      <div className="flex justify-between items-center mb-2 shrink-0">
        <div className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Drawdown Dist (10k Runs)</div>
        {isSimulating && <div className="text-emerald-500 text-[10px] animate-pulse">Computing...</div>}
      </div>
      
      <div className="flex-1 min-h-[140px] shrink-0 border border-gray-800 rounded bg-gray-950/50 w-full overflow-x-auto min-w-0">
        <div className="min-w-max min-h-full flex items-center justify-center" ref={plotContainerRef}>
          {!simResults && !isSimulating && <span className="text-gray-600">No data.</span>}
        </div>
      </div>
      
      {simResults && (
        <div className="mt-3 grid grid-cols-2 gap-2 shrink-0">
          <div className="bg-gray-950 p-2 rounded border border-gray-800">
             <div className="text-gray-500 mb-1 uppercase text-[9px] tracking-wider">95th %ile DD</div>
             <div className="text-red-400 font-bold text-sm">
                {(() => {
                  const sorted = [...simResults.maxDrawdowns].sort((a,b) => a - b);
                  return sorted[Math.floor(sorted.length * 0.95)]?.toFixed(2);
                })()}
             </div>
          </div>
          <div className="bg-gray-950 p-2 rounded border border-gray-800">
             <div className="text-gray-500 mb-1 uppercase text-[9px] tracking-wider">Median DD</div>
             <div className="text-amber-400 font-bold text-sm">
                {(() => {
                  const sorted = [...simResults.maxDrawdowns].sort((a,b) => a - b);
                  return sorted[Math.floor(sorted.length * 0.50)]?.toFixed(2);
                })()}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}