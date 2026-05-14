'use client';

import React, { useEffect } from 'react';
import { getDuckDB } from '@/engine/duckdb';
import { Uploader } from '@/components/shared/Uploader';
import { FilterBar } from '@/components/shared/FilterBar';
import { useGlobalStore } from '@/engine/state';
import { ForensicReplayView } from '@/components/terminal/ForensicReplayView';
import { StrategyDashboardView } from '@/components/terminal/StrategyDashboardView';
import { CommandPalette } from '@/components/shared/CommandPalette';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export default function TerminalPage() {
  const activeView = useGlobalStore((state) => state.activeView);
  const setActiveView = useGlobalStore((state) => state.setActiveView);

  useKeyboardShortcuts();

  useEffect(() => {
    getDuckDB().then(() => console.log('DuckDB Initialization Complete.'));
  }, []);

  return (
    <div className="h-screen w-screen bg-gray-950 text-gray-200 overflow-hidden flex flex-col font-mono text-xs">
      {/* Top Header */}
      <header className="h-12 border-b border-gray-800 flex items-center px-2 sm:px-4 justify-between shrink-0 bg-gray-950 z-20">
        <div className="flex items-center gap-2 sm:gap-4 md:gap-8 min-w-0 flex-1">
          <div className="font-bold text-emerald-400 tracking-tighter text-xs sm:text-sm flex items-center gap-2 sm:gap-4 shrink-0">
            <span className="hidden sm:inline whitespace-nowrap">Posthoc Terminal</span>
            <span className="sm:hidden whitespace-nowrap">Posthoc</span>
            
            {/* View Tab Switcher */}
            <div className="flex bg-gray-900 rounded border border-gray-800 p-0.5 shrink-0">
              <button 
                onClick={() => setActiveView('forensic')}
                className={`px-1.5 sm:px-2 md:px-3 py-1 rounded text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-wider transition-colors ${activeView === 'forensic' ? 'bg-gray-800 text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Forensic
              </button>
              <button 
                onClick={() => setActiveView('dashboard')}
                className={`px-1.5 sm:px-2 md:px-3 py-1 rounded text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-wider transition-colors ${activeView === 'dashboard' ? 'bg-gray-800 text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Dashboard
              </button>
            </div>
          </div>
          
          {/* FilterBar - Now responsive on all screen sizes */}
          <div className="flex-1 min-w-0">
            <FilterBar />
          </div>
        </div>
        
        <div className="flex gap-1.5 sm:gap-2 md:gap-4 items-center shrink-0">
          <Uploader />
          <button className="hidden lg:block bg-gray-800 px-3 py-1 rounded hover:bg-gray-700 transition-colors border border-gray-700 text-gray-400 font-bold text-[10px]">
            CMD+K
          </button>
        </div>
      </header>

      {/* Main View Container */}
      <main className="flex-1 overflow-hidden">
        {activeView === 'forensic' ? <ForensicReplayView /> : <StrategyDashboardView />}
      </main>

      <CommandPalette />
    </div>
  );
}
