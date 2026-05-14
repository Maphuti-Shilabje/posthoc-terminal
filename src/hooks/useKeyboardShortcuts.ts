'use client';

import { useEffect } from 'react';
import { useGlobalStore } from '@/engine/state';
import { eventBus } from '@/engine/events';
import { useTrades } from '@/hooks/useTrades';

export function useKeyboardShortcuts() {
  const activeView = useGlobalStore((state) => state.activeView);
  const setActiveView = useGlobalStore((state) => state.setActiveView);
  const showGraveyard = useGlobalStore((state) => state.userSettings.showGraveyard);
  const updateUserSettings = useGlobalStore((state) => state.updateUserSettings);
  const selectedTradeId = useGlobalStore((state) => state.selectedTradeId);
  const setSelectedTradeId = useGlobalStore((state) => state.setSelectedTradeId);
  
  const { trades } = useTrades();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      // SPACE: Toggle Environment
      if (e.code === 'Space') {
        e.preventDefault();
        setActiveView(activeView === 'forensic' ? 'dashboard' : 'forensic');
      }

      // G: Toggle Graveyard
      if (e.key.toLowerCase() === 'g') {
        updateUserSettings({ showGraveyard: !showGraveyard });
      }

      // T: Teleport to selected trade
      if (e.key.toLowerCase() === 't' && selectedTradeId) {
        const trade = trades.find(t => t.trade_id === selectedTradeId);
        if (trade && trade.entry_time) {
          const min_price = Math.min(trade.entry_price, trade.exit_price || trade.entry_price, trade.stop_loss || trade.entry_price);
          const max_price = Math.max(trade.entry_price, trade.exit_price || trade.entry_price, trade.take_profit || trade.entry_price);
          
          eventBus.emit('TELEPORT_EVENT', {
            timestamp: Number(trade.entry_time),
            price_range: [min_price, max_price],
            context_padding: 50,
            timeframe_hint: 'M15',
          });
        }
      }

      // ARROWS: Step through ledger
      if (trades.length > 0 && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        const currentIndex = selectedTradeId 
          ? trades.findIndex(t => t.trade_id === selectedTradeId) 
          : -1;
        
        let nextIndex = currentIndex;
        if (e.key === 'ArrowRight') {
          nextIndex = currentIndex < trades.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : trades.length - 1;
        }

        const nextTrade = trades[nextIndex];
        if (nextTrade) {
          setSelectedTradeId(nextTrade.trade_id);
          // Auto-teleport on step
          if (nextTrade.entry_time) {
            const min_price = Math.min(nextTrade.entry_price, nextTrade.exit_price || nextTrade.entry_price, nextTrade.stop_loss || nextTrade.entry_price);
            const max_price = Math.max(nextTrade.entry_price, nextTrade.exit_price || nextTrade.entry_price, nextTrade.take_profit || nextTrade.entry_price);
            
            eventBus.emit('TELEPORT_EVENT', {
              timestamp: Number(nextTrade.entry_time),
              price_range: [min_price, max_price],
              context_padding: 50,
              timeframe_hint: 'M15',
            });
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeView, setActiveView, showGraveyard, updateUserSettings, selectedTradeId, setSelectedTradeId, trades]);
}