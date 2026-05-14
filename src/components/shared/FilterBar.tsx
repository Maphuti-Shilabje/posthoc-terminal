'use client';

import React, { useEffect, useState } from 'react';
import { useGlobalStore } from '@/engine/state';
import { queryDuckDB } from '@/engine/duckdb';

export function FilterBar() {
  const activeDatasetId = useGlobalStore((state) => state.activeDatasetId);
  const filters = useGlobalStore((state) => state.filters);
  const setFilters = useGlobalStore((state) => state.setFilters);
  const [strategies, setStrategies] = useState<string[]>([]);

  const sessions = ['london', 'new_york', 'asia', 'gap'];
  const regimes = ['trending_up', 'trending_down', 'ranging', 'high_vol'];

  useEffect(() => {
    if (!activeDatasetId) return;
    const fetchStrategies = async () => {
      try {
        const result = await queryDuckDB<{ strategy_id: string }>(`
          SELECT DISTINCT strategy_id FROM trades WHERE strategy_id IS NOT NULL
        `);
        setStrategies(result.map(r => r.strategy_id));
      } catch {
        console.warn("Could not fetch strategies.");
      }
    };
    fetchStrategies();
  }, [activeDatasetId]);

  return (
    <div className="flex gap-4 items-center">
      {strategies.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-[10px] uppercase font-bold">Strategy:</span>
          <select 
            className="bg-gray-800 border border-gray-700 text-gray-200 text-[10px] rounded px-2 py-0.5 focus:outline-none focus:border-blue-500"
            value={filters.strategyId || ''}
            onChange={(e) => setFilters({ strategyId: e.target.value || null })}
          >
            <option value="">All Runs</option>
            {strategies.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-gray-500 text-[10px] uppercase">Session:</span>
        <select 
          className="bg-gray-800 border border-gray-700 text-gray-200 text-[10px] rounded px-1 py-0.5 focus:outline-none focus:border-emerald-500"
          value={filters.session || ''}
          onChange={(e) => setFilters({ session: e.target.value || null })}
        >
          <option value="">All</option>
          {sessions.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-gray-500 text-[10px] uppercase">Regime:</span>
        <select 
          className="bg-gray-800 border border-gray-700 text-gray-200 text-[10px] rounded px-1 py-0.5 focus:outline-none focus:border-emerald-500"
          value={filters.regime || ''}
          onChange={(e) => setFilters({ regime: e.target.value || null })}
        >
          <option value="">All</option>
          {regimes.map(r => <option key={r} value={r}>{r.toUpperCase().replace('_', ' ')}</option>)}
        </select>
      </div>
    </div>
  );
}