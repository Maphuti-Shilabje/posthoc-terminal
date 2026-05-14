'use client';

import React, { useEffect, useState } from 'react';
import { useGlobalStore } from '@/engine/state';
import { queryDuckDB } from '@/engine/duckdb';
import { ChevronDown, Filter } from 'lucide-react';

export function FilterBar() {
  const activeDatasetId = useGlobalStore((state) => state.activeDatasetId);
  const filters = useGlobalStore((state) => state.filters);
  const setFilters = useGlobalStore((state) => state.setFilters);
  const [strategies, setStrategies] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

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

  // Calculate active filter count
  const activeFilterCount = [filters.strategyId, filters.session, filters.regime].filter(Boolean).length;

  // Desktop view (unchanged)
  const DesktopFilters = () => (
    <div className="hidden md:flex gap-4 items-center">
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

  // Mobile view (collapsible)
  const MobileFilters = () => (
    <div className="md:hidden relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded px-2 py-1 hover:bg-gray-700 transition-colors"
      >
        <Filter size={12} className="text-gray-400" />
        <span className="text-[10px] text-gray-400 font-bold uppercase">
          Filters
        </span>
        {activeFilterCount > 0 && (
          <span className="bg-emerald-600 text-white text-[8px] font-bold px-1 rounded-full min-w-[14px] h-[14px] flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
        <ChevronDown 
          size={12} 
          className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Panel */}
      {isExpanded && (
        <>
          {/* Backdrop to close on outside click */}
          <div 
            className="fixed inset-0 z-30" 
            onClick={() => setIsExpanded(false)}
          />
          
          {/* Filter Panel */}
          <div className="absolute top-full left-0 mt-1 bg-gray-900 border border-gray-700 rounded shadow-xl z-40 min-w-[240px] p-3 space-y-3">
            {strategies.length > 1 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-gray-400 text-[9px] uppercase font-bold">Strategy</span>
                <select 
                  className="bg-gray-800 border border-gray-700 text-gray-200 text-[11px] rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 w-full"
                  value={filters.strategyId || ''}
                  onChange={(e) => setFilters({ strategyId: e.target.value || null })}
                >
                  <option value="">All Runs</option>
                  {strategies.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <span className="text-gray-400 text-[9px] uppercase font-bold">Session</span>
              <select 
                className="bg-gray-800 border border-gray-700 text-gray-200 text-[11px] rounded px-2 py-1.5 focus:outline-none focus:border-emerald-500 w-full"
                value={filters.session || ''}
                onChange={(e) => setFilters({ session: e.target.value || null })}
              >
                <option value="">All</option>
                {sessions.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-gray-400 text-[9px] uppercase font-bold">Regime</span>
              <select 
                className="bg-gray-800 border border-gray-700 text-gray-200 text-[11px] rounded px-2 py-1.5 focus:outline-none focus:border-emerald-500 w-full"
                value={filters.regime || ''}
                onChange={(e) => setFilters({ regime: e.target.value || null })}
              >
                <option value="">All</option>
                {regimes.map(r => <option key={r} value={r}>{r.toUpperCase().replace('_', ' ')}</option>)}
              </select>
            </div>

            {/* Clear All Button */}
            {activeFilterCount > 0 && (
              <button
                onClick={() => {
                  setFilters({ strategyId: null, session: null, regime: null });
                  setIsExpanded(false);
                }}
                className="w-full bg-red-900/30 hover:bg-red-900/50 border border-red-800 text-red-400 text-[10px] font-bold uppercase py-1.5 rounded transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      <DesktopFilters />
      <MobileFilters />
    </>
  );
}
