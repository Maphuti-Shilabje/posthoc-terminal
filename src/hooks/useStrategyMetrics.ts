import { useState, useEffect } from 'react';
import { queryDuckDB } from '@/engine/duckdb';
import { useGlobalStore } from '@/engine/state';

export interface StrategyMetrics {
  netProfit: number;
  grossProfit: number;
  grossLoss: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  percentProfitable: number;
  profitFactor: number;
  maxDrawdown: number;
  avgTrade: number;
  avgWin: number;
  avgLoss: number;
  ratioAvgWinLoss: number;
  largestWin: number;
  largestLoss: number;
  avgBarsInTrade: number;
}

export function useStrategyMetrics() {
  const activeDatasetId = useGlobalStore((state) => state.activeDatasetId);
  const filters = useGlobalStore((state) => state.filters);
  
  const [metrics, setMetrics] = useState<StrategyMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!activeDatasetId) return;

    const fetchMetrics = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let baseQuery = `
          FROM trades t
          JOIN candles c ON t.entry_time = c.timestamp
          WHERE t.status = 'executed'
        `;

        const conditions = [];
        if (filters.session) conditions.push(`c.session = '${filters.session}'`);
        if (filters.regime) conditions.push(`c.regime = '${filters.regime}'`);
        if (filters.strategyId) conditions.push(`t.strategy_id = '${filters.strategyId}'`);
        
        if (conditions.length > 0) {
          baseQuery += ` AND ${conditions.join(' AND ')}`;
        }

        // We use DuckDB aggregations to calculate everything in one pass
        const query = `
          SELECT 
            SUM(t.pnl_raw) as netProfit,
            SUM(CASE WHEN t.pnl_raw > 0 THEN t.pnl_raw ELSE 0 END) as grossProfit,
            SUM(CASE WHEN t.pnl_raw < 0 THEN t.pnl_raw ELSE 0 END) as grossLoss,
            COUNT(*) as totalTrades,
            COUNT(CASE WHEN t.pnl_raw > 0 THEN 1 END) as winningTrades,
            COUNT(CASE WHEN t.pnl_raw < 0 THEN 1 END) as losingTrades,
            MAX(t.mae) as maxDrawdown,
            AVG(t.pnl_raw) as avgTrade,
            AVG(CASE WHEN t.pnl_raw > 0 THEN t.pnl_raw ELSE NULL END) as avgWin,
            AVG(CASE WHEN t.pnl_raw < 0 THEN t.pnl_raw ELSE NULL END) as avgLoss,
            MAX(t.pnl_raw) as largestWin,
            MIN(t.pnl_raw) as largestLoss,
            AVG(t.exit_time - t.entry_time) / (15 * 60 * 1000) as avgBarsInTrade
          ${baseQuery}
        `;

        const result = await queryDuckDB<Record<string, number>>(query);

        if (result.length > 0) {
          const r = result[0];
          
          const netProfit = Number(r.netProfit || 0);
          const grossProfit = Number(r.grossProfit || 0);
          const grossLoss = Math.abs(Number(r.grossLoss || 0));
          const totalTrades = Number(r.totalTrades || 0);
          const winningTrades = Number(r.winningTrades || 0);
          const losingTrades = Number(r.losingTrades || 0);
          const maxDrawdown = Number(r.maxDrawdown || 0);
          const avgTrade = Number(r.avgTrade || 0);
          const avgWin = Number(r.avgWin || 0);
          const avgLoss = Math.abs(Number(r.avgLoss || 0));
          const largestWin = Number(r.largestWin || 0);
          const largestLoss = Number(r.largestLoss || 0);
          const avgBarsInTrade = Number(r.avgBarsInTrade || 0);

          const percentProfitable = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
          const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 99.99 : 0);
          const ratioAvgWinLoss = avgLoss > 0 ? avgWin / avgLoss : (avgWin > 0 ? 99.99 : 0);

          setMetrics({
            netProfit,
            grossProfit,
            grossLoss,
            totalTrades,
            winningTrades,
            losingTrades,
            percentProfitable,
            profitFactor,
            maxDrawdown,
            avgTrade,
            avgWin,
            avgLoss,
            ratioAvgWinLoss,
            largestWin,
            largestLoss,
            avgBarsInTrade
          });
        }
      } catch (err) {
        console.error("Failed to aggregate strategy metrics:", err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [activeDatasetId, filters.session, filters.regime, filters.strategyId]);

  return { metrics, isLoading, error };
}