import { useState, useEffect } from 'react';
import { queryDuckDB } from '@/engine/duckdb';
import { useGlobalStore } from '@/engine/state';
import { Trade } from '@/types/contracts';

export function useTrades() {
  const activeDatasetId = useGlobalStore((state) => state.activeDatasetId);
  const filters = useGlobalStore((state) => state.filters);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!activeDatasetId) return;

    const loadTrades = async () => {
      setIsLoading(true);
      try {
        let query = `
          SELECT t.* 
          FROM trades t
          JOIN candles c ON t.entry_time = c.timestamp
        `;

        const conditions = [];
        if (filters.session) conditions.push(`c.session = '${filters.session}'`);
        if (filters.regime) conditions.push(`c.regime = '${filters.regime}'`);
        if (filters.strategyId) conditions.push(`t.strategy_id = '${filters.strategyId}'`);
        
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }

        query += ` ORDER BY t.entry_time ASC`;

        const result = await queryDuckDB<Trade>(query);
        setTrades(result);
        setError(null);
      } catch (err) {
        console.error("Error loading trades:", err);
        setError(err instanceof Error ? err : new Error('Failed to load trades'));
      } finally {
        setIsLoading(false);
      }
    };

    loadTrades();
  }, [activeDatasetId, filters.session, filters.regime, filters.strategyId]);

  return { trades, isLoading, error };
}