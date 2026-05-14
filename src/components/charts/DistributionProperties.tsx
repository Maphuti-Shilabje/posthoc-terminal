'use client';

import React, { useEffect, useState, useRef } from 'react';
import * as Plot from '@observablehq/plot';
import { useGlobalStore } from '@/engine/state';
import { queryDuckDB } from '@/engine/duckdb';

interface TradeDistribution {
  timestamp: number;
  pnl: number;
  pnl_rel: number;
  session: string;
  regime: string;
}

export function DistributionProperties() {
  const activeDatasetId = useGlobalStore((state) => state.activeDatasetId);
  const filters = useGlobalStore((state) => state.filters);
  const [data, setData] = useState<TradeDistribution[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const histRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeDatasetId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        let baseQuery = `
          SELECT 
            t.entry_time as timestamp, 
            t.pnl_raw as pnl,
            t.pnl_rel as pnl_rel,
            c.session, 
            c.regime 
          FROM trades t
          JOIN candles c ON t.entry_time = c.timestamp
          WHERE t.status = 'executed'
        `;

        const conditions = [];
        if (filters.session) conditions.push(`c.session = '${filters.session}'`);
        if (filters.regime) conditions.push(`c.regime = '${filters.regime}'`);
        if (filters.strategyId) conditions.push(`t.strategy_id = '${filters.strategyId}'`);
        
        if (conditions.length > 0) {
          baseQuery += ` AND ${conditions.join(' AND ')}`;
        }

        const result = await queryDuckDB<Record<string, string | number>>(baseQuery);
        
        const mappedData = result.map(r => ({
          timestamp: Number(r.timestamp),
          pnl: Number(r.pnl),
          pnl_rel: Number(r.pnl_rel) || 0, // Fallback if missing
          session: String(r.session),
          regime: String(r.regime)
        }));

        setData(mappedData);
      } catch (err) {
        console.error("Failed to load distribution data", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeDatasetId, filters.session, filters.regime, filters.strategyId]);

  // P&L Distribution Histogram
  useEffect(() => {
    if (data.length === 0 || !histRef.current) return;

    const containerWidth = histRef.current.clientWidth || 500;

    const plot = Plot.plot({
      width: Math.max(containerWidth, 300),
      height: 200,
      style: {
        background: 'transparent',
        color: '#9ca3af',
        fontSize: '10px',
        fontFamily: 'monospace',
      },
      marks: [
        Plot.ruleY([0], { stroke: '#374151' }),
        Plot.rectY(data, Plot.binX({y: "count"}, {
          x: "pnl", 
          fill: (d: TradeDistribution) => d.pnl > 0 ? "#10b981" : "#ef4444",
          rx: 2
        } as any))
      ],
      x: { 
        label: "P&L Return", 
        grid: false
      },
      y: { 
        label: "Number of Trades", 
        grid: true 
      }
    });

    histRef.current.innerHTML = '';
    histRef.current.appendChild(plot);

    return () => plot.remove();
  }, [data]);

  if (isLoading) {
    return <div className="p-4 text-gray-500 animate-pulse uppercase tracking-widest text-xs h-full flex items-center justify-center border border-gray-800 rounded bg-gray-950">Loading Properties...</div>;
  }

  if (data.length === 0) {
    return <div className="p-4 text-gray-500 text-xs h-full flex items-center justify-center border border-gray-800 rounded bg-gray-950">No distribution data available.</div>;
  }

  // Calculate Win/Loss Stats for Donut
  const totalTrades = data.length;
  const wins = data.filter(d => d.pnl > 0);
  const losses = data.filter(d => d.pnl < 0);
  const breakEven = data.filter(d => d.pnl === 0);
  
  const winPct = (wins.length / totalTrades) * 100;
  const lossPct = (losses.length / totalTrades) * 100;
  const bePct = (breakEven.length / totalTrades) * 100;

  // Simple SVG Donut Math (Circumference ~ 251.2 for r=40)
  const c = 2 * Math.PI * 40;
  const winDash = (winPct / 100) * c;
  const lossDash = (lossPct / 100) * c;

  return (
    <div className="flex flex-col h-full bg-gray-950 rounded border border-gray-800 overflow-hidden min-w-0">
      <div className="p-2 border-b border-gray-800 bg-gray-900/50 font-bold uppercase tracking-wider text-gray-400 text-[10px]">Trades Analysis</div>
      
      <div className="flex-1 w-full flex flex-col p-4 gap-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800">
        
        {/* Top Half: Histogram */}
        <div>
          <div className="font-bold text-gray-300 text-xs mb-2">P&L Distribution</div>
          <div className="w-full flex items-center justify-center overflow-x-auto min-w-0">
             <div className="min-w-max" ref={histRef} />
          </div>
        </div>

        <div className="border-t border-gray-800" />

        {/* Bottom Half: Win/Loss Ratio */}
        <div>
          <div className="font-bold text-gray-300 text-xs mb-4">Win/Loss Ratio</div>
          <div className="flex items-center gap-8 justify-center">
            
            {/* SVG Donut */}
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {/* Background Ring */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#1f2937" strokeWidth="12" />
                {/* Loss Segment (Red) */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ef4444" strokeWidth="12" strokeDasharray={`${lossDash} ${c}`} />
                {/* Win Segment (Green) - Offset by Loss */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="12" strokeDasharray={`${winDash} ${c}`} strokeDashoffset={-lossDash} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-bold text-gray-200">{totalTrades}</span>
                <span className="text-[9px] text-gray-500 uppercase tracking-widest leading-none mt-1">Total<br/>Trades</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-col gap-2 font-mono text-[10px]">
              <div className="flex items-center gap-6 justify-between">
                <div className="flex items-center gap-2 text-emerald-400">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" /> Wins
                </div>
                <div className="text-gray-300">{wins.length} trades</div>
                <div className="text-gray-500 w-12 text-right">{winPct.toFixed(2)}%</div>
              </div>
              <div className="flex items-center gap-6 justify-between">
                <div className="flex items-center gap-2 text-red-400">
                  <div className="w-2 h-2 rounded-full bg-red-500" /> Losses
                </div>
                <div className="text-gray-300">{losses.length} trades</div>
                <div className="text-gray-500 w-12 text-right">{lossPct.toFixed(2)}%</div>
              </div>
              <div className="flex items-center gap-6 justify-between">
                <div className="flex items-center gap-2 text-yellow-400">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" /> Break even
                </div>
                <div className="text-gray-300">{breakEven.length} trades</div>
                <div className="text-gray-500 w-12 text-right">{bePct.toFixed(2)}%</div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}