'use client';

import React, { useRef, useState } from 'react';
import { PanelImperativeHandle } from 'react-resizable-panels';
import { MainChart } from '@/components/charts/MainChart';
import { TradeLedger } from '@/components/terminal/TradeLedger';
import { TradeInspector } from '@/components/terminal/TradeInspector';
import { MonteCarloLab } from '@/components/terminal/MonteCarloLab';
import { ForensicSummary } from '@/components/terminal/ForensicSummary';
import { ParameterHeatmap } from '@/components/charts/ParameterHeatmap';
import { IntelligencePanel } from '@/components/shared/IntelligencePanel';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { StrategicAccordion } from '@/components/shared/StrategicAccordion';
import { useIntelligence, WeaknessInsight } from '@/hooks/useIntelligence';
import { useGlobalStore } from '@/engine/state';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Maximize2, Minimize2, AlertCircle, ShieldAlert } from 'lucide-react';

function IntelSummary({ insights = [] }: { insights: WeaknessInsight[] }) {
  const criticalCount = insights.filter(i => i.type === 'critical').length;
  const warningCount = insights.filter(i => i.type === 'warning').length;
  
  if (criticalCount === 0 && warningCount === 0) return null;
  
  return (
    <div className="flex gap-1 items-center animate-in fade-in duration-500">
      {criticalCount > 0 && (
        <div className="flex items-center gap-1 bg-red-900/40 px-1.5 py-0.5 rounded border border-red-800/50">
          <ShieldAlert size={10} className="text-red-500" />
          <span className="text-[9px] font-bold text-red-400">{criticalCount}</span>
        </div>
      )}
      {warningCount > 0 && (
        <div className="flex items-center gap-1 bg-amber-900/40 px-1.5 py-0.5 rounded border border-amber-800/50">
          <AlertCircle size={10} className="text-amber-500" />
          <span className="text-[9px] font-bold text-amber-400">{warningCount}</span>
        </div>
      )}
    </div>
  );
}

function MCSummary() {
  const { medianDD, p95DD, isSimulating } = useGlobalStore((state) => state.mcMetrics);
  
  if (isSimulating) return <div className="text-[9px] text-emerald-500 animate-pulse font-bold pr-2">SIMULATING...</div>;
  if (medianDD === null) return null;
  
  return (
    <div className="flex gap-2 items-center text-[9px] font-mono pr-2">
      <div className="text-gray-500">
        MED: <span className="text-amber-400 font-bold">${medianDD?.toFixed(1)}</span>
      </div>
      <div className="text-gray-500 border-l border-gray-800 pl-2">
        P95: <span className="text-red-400 font-bold">${p95DD?.toFixed(1)}</span>
      </div>
    </div>
  );
}

export function ForensicReplayView() {
  const chartPanelRef = useRef<PanelImperativeHandle>(null);
  const [isLedgerMaximized, setIsLedgerMaximized] = useState(false);
  const isMobile = useMediaQuery("(max-width: 1024px)");
  
  // Get intelligence data for sidebar summary
  const { insights, isLoading: isIntelLoading } = useIntelligence();

  const toggleLedgerMaximize = () => {
    if (chartPanelRef.current) {
      if (isLedgerMaximized) {
        chartPanelRef.current.expand();
      } else {
        chartPanelRef.current.collapse();
      }
    }
  };

  return (
    <ResizablePanelGroup 
      orientation={isMobile ? "vertical" : "horizontal"} 
      className="h-full w-full"
    >
      {/* Main Stage (Chart + Ledger) - LEFT on desktop, TOP on mobile */}
      <ResizablePanel 
        defaultSize={isMobile ? 60 : 80} 
        minSize={isMobile ? 40 : 50} 
        maxSize={isMobile ? 80 : 90} 
        className="min-w-0"
      >
        <ResizablePanelGroup orientation="vertical">
          
          {/* Chart Panel */}
          <ResizablePanel 
            panelRef={chartPanelRef} 
            defaultSize={isMobile ? 50 : 65} 
            minSize={0} 
            collapsible
            onResize={(size) => setIsLedgerMaximized(size.asPercentage === 0)}
            className="min-h-0"
          >
            <div className="h-full relative bg-[#030712] overflow-hidden border-b border-gray-900">
              <div className="absolute top-2 left-2 text-gray-500 z-10 select-none text-[10px] font-bold uppercase tracking-widest bg-gray-950/70 px-2 py-1 rounded border border-gray-800/50 backdrop-blur-sm">
                Forensic Market Replay
              </div>
              <MainChart />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Ledger Panel */}
          <ResizablePanel 
            defaultSize={isMobile ? 50 : 35} 
            minSize={15} 
            className="min-h-0"
          >
            <div className="h-full flex flex-col bg-gray-950 overflow-hidden relative">
              <div className="sticky top-0 bg-gray-950/80 backdrop-blur-md text-gray-500 p-2 select-none border-b border-gray-800 z-10 font-bold shrink-0 flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-widest pl-1">Trade Ledger & Graveyard</span>
                <button 
                  onClick={toggleLedgerMaximize}
                  className="p-1 hover:bg-gray-800 rounded transition-colors text-gray-600 hover:text-emerald-400"
                  title={isLedgerMaximized ? "Restore Layout" : "Maximize Ledger"}
                >
                  {isLedgerMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
              </div>
              <div className="flex-1 flex flex-col overflow-hidden p-3 bg-gray-950 min-w-0">
                <ForensicSummary />
                <div className="flex-1 overflow-hidden border border-gray-800/50 rounded-sm shadow-inner min-w-0">
                  <TradeLedger />
                </div>
              </div>
            </div>
          </ResizablePanel>

        </ResizablePanelGroup>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Diagnostic Sidebar - RIGHT on desktop, BOTTOM on mobile */}
      <ResizablePanel 
        defaultSize={isMobile ? 40 : 20} 
        minSize={isMobile ? 20 : 15} 
        maxSize={isMobile ? 60 : 35}
        className="min-w-0"
      >
        <div className="h-full flex flex-col bg-gray-950 overflow-y-auto divide-y divide-gray-800 border-l lg:border-l border-t lg:border-t-0 border-gray-800 min-w-0">
          
          <StrategicAccordion title="Trade DNA Inspector" defaultOpen={true}>
            <div className="min-h-[400px]">
              <TradeInspector />
            </div>
          </StrategicAccordion>

          <StrategicAccordion 
            title="Strategy Intelligence" 
            summary={<IntelSummary insights={insights} />}
            defaultOpen={insights.length > 0}
          >
            <div className="bg-gray-950/40">
              <IntelligencePanel insights={insights} isLoading={isIntelLoading} />
            </div>
          </StrategicAccordion>

          <StrategicAccordion 
            title="Robustness Lab" 
            summary={<MCSummary />}
          >
            <div className="p-4 bg-gray-950 space-y-6">
              <MonteCarloLab />
              <div className="border-t border-gray-800 pt-4">
                <ParameterHeatmap />
              </div>
            </div>
          </StrategicAccordion>

          {/* Utility / Memory usage footer */}
          <div className="mt-auto p-2 text-[9px] text-gray-600 flex justify-between items-center bg-gray-950 sticky bottom-0">
            <span className="uppercase tracking-tighter">Local-First Architecture</span>
            <span className="bg-emerald-950/30 text-emerald-600 px-1 rounded border border-emerald-900/20">DB: OK</span>
          </div>

        </div>
      </ResizablePanel>

    </ResizablePanelGroup>
  );
}