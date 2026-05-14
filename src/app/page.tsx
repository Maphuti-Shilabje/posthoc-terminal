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
      <header className="h-12 border-b border-gray-800 flex items-center px-4 justify-between shrink-0 bg-gray-950 z-20">
        <div className="flex items-center gap-8">
          <div className="font-bold text-emerald-400 tracking-tighter text-sm flex items-center gap-4">
            Posthoc Terminal
            
            {/* View Tab Switcher */}
            <div className="flex bg-gray-900 rounded border border-gray-800 p-0.5 ml-4">
              <button 
                onClick={() => setActiveView('forensic')}
                className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${activeView === 'forensic' ? 'bg-gray-800 text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Forensic Replay
              </button>
              <button 
                onClick={() => setActiveView('dashboard')}
                className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${activeView === 'dashboard' ? 'bg-gray-800 text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Strategy Dashboard
              </button>
            </div>
          </div>
          
          <FilterBar />
        </div>
        <div className="flex gap-4 items-center">
          <Uploader />
          <button className="bg-gray-800 px-3 py-1 rounded hover:bg-gray-700 transition-colors border border-gray-700 text-gray-400 font-bold text-[10px]">CMD+K</button>
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