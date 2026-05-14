'use client';

import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, Time, AreaSeries, HistogramSeries, CrosshairMode } from 'lightweight-charts';
import { useGlobalStore } from '@/engine/state';
import { queryDuckDB } from '@/engine/duckdb';

export function EquityCurve() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const equitySeriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const drawdownSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const activeDatasetId = useGlobalStore((state) => state.activeDatasetId);
  const filters = useGlobalStore((state) => state.filters);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' }, 
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
      },
      rightPriceScale: {
        scaleMargins: {
          top: 0.1,
          bottom: 0.3, // Leave bottom 30% for drawdown
        },
      },
    });

    const equitySeries = chart.addSeries(AreaSeries, {
      topColor: 'rgba(16, 185, 129, 0.4)', // emerald-500
      bottomColor: 'rgba(16, 185, 129, 0.0)',
      lineColor: '#10b981',
      lineWidth: 2,
    });

    const drawdownSeries = chart.addSeries(HistogramSeries, {
      color: 'rgba(239, 68, 68, 0.4)', // red-500
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // Put it on its own hidden scale
    });
    
    // Scale margins for drawdown (sit at the very bottom)
    drawdownSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.75, // top 75% empty
        bottom: 0,
      },
    });

    chartRef.current = chart;
    equitySeriesRef.current = equitySeries;
    drawdownSeriesRef.current = drawdownSeries;

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || !chartRef.current) return;
      const { width, height } = entries[0].contentRect;
      chartRef.current.applyOptions({ width, height });
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!activeDatasetId || !equitySeriesRef.current || !drawdownSeriesRef.current) return;

    const fetchData = async () => {
      try {
        let baseQuery = `
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

        // Group by timestamp to prevent duplicate time entries in lightweight-charts
        const query = `
          SELECT 
            t.entry_time as timestamp,
            SUM(SUM(t.pnl_raw)) OVER (ORDER BY t.entry_time ASC) as cumulative_pnl
          ${baseQuery}
          GROUP BY t.entry_time
          ORDER BY t.entry_time ASC
        `;

        const result = await queryDuckDB<{ timestamp: number | bigint, cumulative_pnl: number }>(query);
        
        const equityData: { time: Time; value: number }[] = [];
        const drawdownData: { time: Time; value: number }[] = [];
        
        let peak = 0;

        result.forEach((row) => {
          const ts = (Number(row.timestamp) / 1000) as Time;
          const equity = Number(row.cumulative_pnl);
          
          if (equity > peak) peak = equity;
          const dd = equity - peak; // <= 0

          equityData.push({ time: ts, value: equity });
          drawdownData.push({ time: ts, value: dd });
        });

        equitySeriesRef.current?.setData(equityData);
        drawdownSeriesRef.current?.setData(drawdownData);
        chartRef.current?.timeScale().fitContent();

      } catch (err) {
        console.error("Failed to load equity curve data", err);
      }
    };

    fetchData();
  }, [activeDatasetId, filters.session, filters.regime, filters.strategyId]);

  return (
    <div className="flex flex-col h-full bg-gray-950 rounded border border-gray-800 overflow-hidden min-w-0">
      <div className="p-2 border-b border-gray-800 bg-gray-900/50 font-bold uppercase tracking-wider text-gray-400 text-[10px]">
        Cumulative Equity & Drawdown
      </div>
      <div className="flex-1 w-full min-h-0 relative">
        <div ref={chartContainerRef} className="absolute inset-0" />
      </div>
    </div>
  );
}