'use client';

import React, { useEffect, useState } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useGlobalStore } from '@/engine/state';
import { useTrades } from '@/hooks/useTrades';
import { eventBus } from '@/engine/events';
import { Monitor, Search, Ghost, Navigation, BarChart3 } from 'lucide-react';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const activeView = useGlobalStore((state) => state.activeView);
  const setActiveView = useGlobalStore((state) => state.setActiveView);
  const showGraveyard = useGlobalStore((state) => state.userSettings.showGraveyard);
  const updateUserSettings = useGlobalStore((state) => state.updateUserSettings);
  const setSelectedTradeId = useGlobalStore((state) => state.setSelectedTradeId);
  
  const { trades } = useTrades();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  const teleportToTrade = (tradeId: string) => {
    const trade = trades.find(t => t.trade_id === tradeId);
    if (!trade) return;

    setSelectedTradeId(tradeId);
    if (trade.entry_time) {
      const min_price = Math.min(trade.entry_price, trade.exit_price || trade.entry_price, trade.stop_loss || trade.entry_price);
      const max_price = Math.max(trade.entry_price, trade.exit_price || trade.entry_price, trade.take_profit || trade.entry_price);
      
      eventBus.emit('TELEPORT_EVENT', {
        timestamp: Number(trade.entry_time),
        price_range: [min_price, max_price],
        context_padding: 50,
        timeframe_hint: 'M15',
      });
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search trade IDs..." />
      <CommandList className="max-h-[300px] font-mono scrollbar-thin">
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="System Environments">
          <CommandItem onSelect={() => runCommand(() => setActiveView('forensic'))}>
            <Monitor className="mr-2 h-4 w-4 text-emerald-400" />
            <span>Switch to Forensic Replay</span>
            {activeView === 'forensic' && <span className="ml-auto text-[10px] text-emerald-600">Active</span>}
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setActiveView('dashboard'))}>
            <BarChart3 className="mr-2 h-4 w-4 text-emerald-400" />
            <span>Switch to Strategy Dashboard</span>
            {activeView === 'dashboard' && <span className="ml-auto text-[10px] text-emerald-600">Active</span>}
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Diagnostic Controls">
          <CommandItem onSelect={() => runCommand(() => updateUserSettings({ showGraveyard: !showGraveyard }))}>
            <Ghost className="mr-2 h-4 w-4 text-amber-400" />
            <span>{showGraveyard ? 'Hide' : 'Show'} Trade Graveyard Layer</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-gray-900 px-1.5 font-mono text-[10px] font-medium text-gray-500 opacity-100">
              G
            </kbd>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Direct Teleport (Recent Trades)">
          {trades.slice(0, 50).map((trade) => (
            <CommandItem 
              key={trade.trade_id} 
              value={trade.trade_id}
              onSelect={() => runCommand(() => teleportToTrade(trade.trade_id))}
            >
              <Navigation className="mr-2 h-4 w-4 text-blue-400" />
              <span className="truncate">Jump to: {trade.trade_id.slice(0, 12)}...</span>
              <span className={`ml-auto text-[9px] font-bold ${trade.pnl_raw > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                ${trade.pnl_raw?.toFixed(1)}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}