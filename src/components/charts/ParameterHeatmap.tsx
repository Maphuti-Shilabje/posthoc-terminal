'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useGlobalStore } from '@/engine/state';
import { queryDuckDB } from '@/engine/duckdb';
import * as Plot from '@observablehq/plot';

interface SweepRow {
  atr_mult: number;
  rsi_len: number;
  sharpe_ratio: number;
  win_rate: number;
}

export function ParameterHeatmap() {
  const activeDatasetId = useGlobalStore((state) => state.activeDatasetId);
  const [sweepData, setSweepData] = useState<SweepRow[]>([]);
  const plotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeDatasetId) return;

    const loadSweep = async () => {
      try {
        const result = await queryDuckDB<SweepRow>(`
          SELECT * FROM sweeps
        `);
        setSweepData(result);
      } catch {
        console.warn("Sweeps table not found.");
      }
    };

    loadSweep();
  }, [activeDatasetId]);

  useEffect(() => {
    if (sweepData.length === 0 || !plotRef.current) return;

    const plot = Plot.plot({
      width: 280,
      height: 200,
      style: {
        background: 'transparent',
        color: '#9ca3af',
        fontSize: '10px',
        fontFamily: 'monospace',
      },
      padding: 0,
      x: { label: "RSI Length", type: "band" },
      y: { label: "ATR Mult", type: "band" },
      color: { 
        scheme: "PuBuGn", 
        label: "Sharpe", 
        legend: false 
      },
      marks: [
        Plot.cell(sweepData, { 
          x: "rsi_len", 
          y: "atr_mult", 
          fill: "sharpe_ratio",
          inset: 0.5 
        }),
        Plot.text(sweepData, { 
          x: "rsi_len", 
          y: "atr_mult", 
          text: (d: SweepRow) => d.sharpe_ratio.toFixed(1),
          fill: "white",
          fontSize: 8
        })
      ]
    });

    plotRef.current.innerHTML = '';
    plotRef.current.appendChild(plot);

    return () => plot.remove();
  }, [sweepData]);

  if (!activeDatasetId || sweepData.length === 0) return null;

  return (
    <div className="flex flex-col mt-4 min-w-0">
      <div className="text-gray-500 font-bold uppercase tracking-wider text-[10px] mb-2">Parameter Sensitivity (Sharpe)</div>
      <div className="bg-gray-950 p-2 rounded border border-gray-800 w-full overflow-x-auto min-w-0">
        <div className="min-w-max min-h-full flex items-center justify-center" ref={plotRef} />
      </div>
    </div>
  );
}