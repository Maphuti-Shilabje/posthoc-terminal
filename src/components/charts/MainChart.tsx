'use client';
import React, { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries, IChartApi, ISeriesApi, Time, SeriesMarker, createSeriesMarkers, AreaSeries, ISeriesMarkersPluginApi } from 'lightweight-charts';
import { eventBus } from '@/engine/events';
import { useGlobalStore } from '@/engine/state';
import { queryDuckDB } from '@/engine/duckdb';
import { TeleportEventPayload, RawCandle, RawTrade } from '@/types/contracts';

export function MainChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const equitySeriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const markersPluginRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const timeToIndexMap = useRef<Map<number, number>>(new Map());

  const activeDatasetId = useGlobalStore((state) => state.activeDatasetId);
  const filters = useGlobalStore((state) => state.filters);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' }, 
        textColor: '#9ca3af', // text-gray-400
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
        mode: 0,
      },
      leftPriceScale: {
        visible: true,
        borderColor: '#1f2937',
      },
      rightPriceScale: {
        visible: true,
        borderColor: '#1f2937',
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981', // emerald-500
      downColor: '#ef4444', // red-500
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
      priceScaleId: 'right',
    });

    const equitySeries = chart.addSeries(AreaSeries, {
      lineColor: '#3b82f6', // blue-500
      topColor: 'rgba(59, 130, 246, 0.4)',
      bottomColor: 'rgba(59, 130, 246, 0.0)',
      lineWidth: 2,
      priceScaleId: 'left',
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    equitySeriesRef.current = equitySeries;

    const container = chartContainerRef.current;
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || !chartRef.current) return;
      const { width, height } = entries[0].contentRect;
      chartRef.current.applyOptions({ width, height });
    });

    if (container) {
      resizeObserver.observe(container);
    }

    // Event Bus Subscription: Teleport Engine Sync
    const teleportHandler = (payload: TeleportEventPayload) => {
      const index = timeToIndexMap.current.get(payload.timestamp);
      if (index !== undefined && chartRef.current) {
        const padding = payload.context_padding || 50;
        chartRef.current.timeScale().setVisibleLogicalRange({
          from: index - padding,
          to: index + padding,
        });
      } else {
        console.warn('Teleport failed: Timestamp not found in index map', payload.timestamp);
      }
    };

    eventBus.on('TELEPORT_EVENT', teleportHandler);

    return () => {
      resizeObserver.disconnect();
      eventBus.off('TELEPORT_EVENT', teleportHandler);
      chart.remove();
    };
  }, []);

  // Fetch Data when dataset changes
  useEffect(() => {
    if (!activeDatasetId || !candlestickSeriesRef.current) return;

    const loadData = async () => {
      try {
        // Query DuckDB directly for visual data.
        const data = await queryDuckDB<RawCandle>(`
          SELECT timestamp, open, high, low, close 
          FROM candles 
          ORDER BY timestamp ASC
        `);
        
        timeToIndexMap.current.clear();

        const formattedData = data.map((d, index: number) => {
          const ts = Number(d.timestamp);
          timeToIndexMap.current.set(ts, index);
          
          return {
            time: (ts / 1000) as Time, // Unix seconds for lightweight-charts
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
          };
        });
        
        candlestickSeriesRef.current?.setData(formattedData);
        
        // Query trades for markers and equity curve
        const markers: SeriesMarker<Time>[] = [];
        const equityData: { time: Time, value: number }[] = [];
        let cumulativePnl = 0;

        try {
          let tradesQuery = `
            SELECT t.trade_id, t.status, t.direction, t.entry_time, t.exit_time, t.pnl_raw 
            FROM trades t
            JOIN candles c ON t.entry_time = c.timestamp
          `;

          const conditions = [];
          if (filters.session) conditions.push(`c.session = '${filters.session}'`);
          if (filters.regime) conditions.push(`c.regime = '${filters.regime}'`);
          if (filters.strategyId) conditions.push(`t.strategy_id = '${filters.strategyId}'`);
          
          if (conditions.length > 0) {
            tradesQuery += ` WHERE ${conditions.join(' AND ')}`;
          }

          tradesQuery += ` ORDER BY t.entry_time ASC`;

          const tradesData = await queryDuckDB<RawTrade>(tradesQuery);
          
          tradesData.forEach((t) => {
            const entryTs = Number(t.entry_time);
            const isLong = t.direction === 'long';
            const isRejected = t.status === 'rejected';
            
            // Entry Marker
            markers.push({
              time: (entryTs / 1000) as Time,
              position: isLong ? 'belowBar' : 'aboveBar',
              color: isRejected ? 'rgba(107, 114, 128, 0.5)' : (isLong ? '#10b981' : '#ef4444'),
              shape: isLong ? 'arrowUp' : 'arrowDown',
              text: isRejected ? 'Ghost' : 'Entry',
              id: `${t.trade_id}_entry`,
            });
            
            // Exit Marker & Equity Curve (if executed and has exit_time)
            if (!isRejected && t.exit_time) {
              const exitTs = Number(t.exit_time);
              markers.push({
                time: (exitTs / 1000) as Time,
                position: isLong ? 'aboveBar' : 'belowBar',
                color: '#3b82f6', // blue for exits
                shape: isLong ? 'arrowDown' : 'arrowUp',
                text: 'Exit',
                id: `${t.trade_id}_exit`,
              });

              // Equity Calculation
              if (t.pnl_raw !== null && t.pnl_raw !== undefined) {
                cumulativePnl += Number(t.pnl_raw);
                // In a real system, you might want to use exact trade closing time, but for the curve it must be sorted.
                // We'll push it, and sort later.
                equityData.push({
                  time: (exitTs / 1000) as Time,
                  value: cumulativePnl
                });
              }
            }
          });
          
          // Sort markers by time (required by lightweight-charts)
          markers.sort((a, b) => (a.time as number) - (b.time as number));
          
          if (markers.length > 0 && candlestickSeriesRef.current) {
            if (!markersPluginRef.current) {
              markersPluginRef.current = createSeriesMarkers(candlestickSeriesRef.current, markers);
            } else {
              markersPluginRef.current.setMarkers(markers);
            }
          }

          // Sort and set equity data
          equityData.sort((a, b) => (a.time as number) - (b.time as number));
          
          // Deduplicate timestamps (keep the last cumulative value for the same timestamp)
          const uniqueEquityData: { time: Time, value: number }[] = [];
          for (const item of equityData) {
            if (uniqueEquityData.length > 0 && uniqueEquityData[uniqueEquityData.length - 1].time === item.time) {
               uniqueEquityData[uniqueEquityData.length - 1].value = item.value;
            } else {
               uniqueEquityData.push(item);
            }
          }

          // To make the chart look connected from the start, we might prepend an initial 0 equity at the first candle
          if (uniqueEquityData.length > 0 && formattedData.length > 0) {
             const firstCandleTime = formattedData[0].time;
             if ((uniqueEquityData[0].time as number) > (firstCandleTime as number)) {
                 uniqueEquityData.unshift({ time: firstCandleTime, value: 0 });
             }
          }

          equitySeriesRef.current?.setData(uniqueEquityData);

        } catch (e) {
          console.warn("Trades table not found or error loading markers.", e);
        }

        chartRef.current?.timeScale().fitContent();
        
      } catch (err) {
        console.error("Error loading candles into chart. Ensure 'candles.csv' was uploaded.", err);
      }
    };

    loadData();
  }, [activeDatasetId, filters.session, filters.regime, filters.strategyId]);

  return <div ref={chartContainerRef} className="w-full h-full absolute inset-0 pt-8 pb-2 px-2" />;
}