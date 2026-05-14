'use client';

import React, { useEffect, useState } from 'react';
import { useGlobalStore } from '@/engine/state';
import { queryDuckDB } from '@/engine/duckdb';

interface SummaryStats {
  realizedPnL: number;
  lostPnL: number;
  savedDrawdown: number;
  winRate: number;
}

export function ForensicSummary() {
  const activeDatasetId = useGlobalStore((state) => state.activeDatasetId);
  const filters = useGlobalStore((state) => state.filters);
  const [stats, setStats] = useState<SummaryStats | null>(null);

  useEffect(() => {
    if (!activeDatasetId) return;

    const calculateStats = async () => {
      try {
        const baseQuery = `
          FROM trades t
          JOIN candles c ON t.entry_time = c.timestamp
        `;

        const conditions = [];
        if (filters.session) conditions.push(`c.session = '${filters.session}'`);
        if (filters.regime) conditions.push(`c.regime = '${filters.regime}'`);
        if (filters.strategyId) conditions.push(`t.strategy_id = '${filters.strategyId}'`);
        
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const result = await queryDuckDB<{ 
          realized: number, 
          lost: number, 
          saved: number,
          total_executed: number,
          wins_executed: number
        }>(`
          SELECT 
            SUM(CASE WHEN t.status = 'executed' THEN t.pnl_raw ELSE 0 END) as realized,
            SUM(CASE WHEN t.status = 'rejected' AND t.pnl_raw > 0 THEN t.pnl_raw ELSE 0 END) as lost,
            SUM(CASE WHEN t.status = 'rejected' AND t.pnl_raw < 0 THEN ABS(t.pnl_raw) ELSE 0 END) as saved,
            COUNT(CASE WHEN t.status = 'executed' THEN 1 END) as total_executed,
            COUNT(CASE WHEN t.status = 'executed' AND t.pnl_raw > 0 THEN 1 END) as wins_executed
          ${baseQuery}
          ${whereClause}
        `);

        if (result.length > 0) {
          const r = result[0];
          setStats({
            realizedPnL: Number(r.realized || 0),
            lostPnL: Number(r.lost || 0),
            savedDrawdown: Number(r.saved || 0),
            winRate: r.total_executed > 0 ? (Number(r.wins_executed) / Number(r.total_executed)) * 100 : 0
          });
        }
      } catch (err) {
        console.error("Forensic Summary Error:", err);
      }
    };

    calculateStats();
  }, [activeDatasetId, filters.session, filters.regime, filters.strategyId]);

  if (!stats) return null;

  return (
    <div className="mb-2 bg-gray-900/50 border border-gray-800 rounded overflow-x-auto scrollbar-none shrink-0">
      <div className="grid grid-cols-4 gap-2 p-2 min-w-[450px]">
        <div className="flex flex-col min-w-0">
          <span className="text-gray-500 text-[9px] uppercase font-bold truncate">Realized PnL</span>
          <span className={`text-sm font-bold truncate ${stats.realizedPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            ${stats.realizedPnL.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
        
        <div className="flex flex-col border-l border-gray-800 pl-2 min-w-0">
          <span className="text-gray-500 text-[9px] uppercase font-bold truncate">Lost Opp.</span>
          <span className="text-amber-400 text-sm font-bold truncate">
            -${stats.lostPnL.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex flex-col border-l border-gray-800 pl-2 min-w-0">
          <span className="text-gray-500 text-[9px] uppercase font-bold truncate">Saved Risk</span>
          <span className="text-emerald-500 text-sm font-bold truncate">
            +${stats.savedDrawdown.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex flex-col border-l border-gray-800 pl-2 min-w-0">
          <span className="text-gray-500 text-[9px] uppercase font-bold truncate">Win Rate</span>
          <span className="text-gray-200 text-sm font-bold truncate">
            {stats.winRate.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}