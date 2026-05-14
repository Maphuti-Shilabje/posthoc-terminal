import { useState, useEffect } from 'react';
import { queryDuckDB } from '@/engine/duckdb';
import { useGlobalStore } from '@/engine/state';
import { Trade, Signal } from '@/types/contracts';

export function useTradeDNA(selectedTradeId: string | null) {
  const activeDatasetId = useGlobalStore((state) => state.activeDatasetId);
  const [tradeDetails, setTradeDetails] = useState<Trade | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!selectedTradeId || !activeDatasetId) return;

    const fetchTradeDNA = async () => {
      setIsLoading(true);
      try {
        const tradesQuery = await queryDuckDB<Trade>(`
          SELECT * FROM trades WHERE trade_id = '${selectedTradeId}' LIMIT 1
        `);
        
        let signalsQuery: Signal[] = [];
        try {
          signalsQuery = await queryDuckDB<Signal>(`
            SELECT * FROM signals WHERE trade_id = '${selectedTradeId}'
          `);
        } catch {
          console.warn("Signals table might not be loaded yet.");
        }

        if (tradesQuery.length > 0) {
          setTradeDetails(tradesQuery[0] as Trade);
        }
        setSignals(signalsQuery as Signal[]);
      } catch (err) {
        console.error("Failed to load Trade DNA:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTradeDNA();
  }, [selectedTradeId, activeDatasetId]);

  return { tradeDetails, signals, isLoading };
}