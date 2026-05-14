import { useState, useEffect } from 'react';
import { queryDuckDB } from '@/engine/duckdb';
import { useGlobalStore } from '@/engine/state';

export interface PerformanceDirectionMetrics {
  direction: 'all' | 'long' | 'short';
  netProfit: number;
  grossProfit: number;
  grossLoss: number;
  maxDrawdown: number;
  totalTrades: number;
  percentProfitable: number;
  profitFactor: number;
  avgTrade: number;
  avgWin: number;
  avgLoss: number;
  ratioAvgWinLoss: number;
  largestWin: number;
  largestLoss: number;
  sharpeRatio: number;
  sortinoRatio: number;
}

export interface PerformanceSummary {
  all: PerformanceDirectionMetrics | null;
  long: PerformanceDirectionMetrics | null;
  short: PerformanceDirectionMetrics | null;
  buyAndHoldReturn?: number;
  buyAndHoldReturnUSD?: number;
  strategyOutperformance?: number;
}

export function usePerformanceSummary() {
  const activeDatasetId = useGlobalStore((state) => state.activeDatasetId);
  const filters = useGlobalStore((state) => state.filters);
  
  const [summary, setSummary] = useState<PerformanceSummary>({ all: null, long: null, short: null });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!activeDatasetId) return;

    const fetchSummary = async () => {
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

        const metricsSelect = `
          SUM(t.pnl_raw) as netProfit,
          SUM(CASE WHEN t.pnl_raw > 0 THEN t.pnl_raw ELSE 0 END) as grossProfit,
          SUM(CASE WHEN t.pnl_raw < 0 THEN t.pnl_raw ELSE 0 END) as grossLoss,
          COUNT(*) as totalTrades,
          COUNT(CASE WHEN t.pnl_raw > 0 THEN 1 END) as winningTrades,
          MAX(t.mae) as maxDrawdown,
          AVG(t.pnl_raw) as avgTrade,
          AVG(CASE WHEN t.pnl_raw > 0 THEN t.pnl_raw ELSE NULL END) as avgWin,
          AVG(CASE WHEN t.pnl_raw < 0 THEN t.pnl_raw ELSE NULL END) as avgLoss,
          MAX(t.pnl_raw) as largestWin,
          MIN(t.pnl_raw) as largestLoss,
          AVG(t.pnl_rel) / NULLIF(STDDEV_SAMP(t.pnl_rel), 0) as sharpeRatio,
          AVG(t.pnl_rel) / NULLIF(STDDEV_SAMP(CASE WHEN t.pnl_rel < 0 THEN t.pnl_rel ELSE NULL END), 0) as sortinoRatio
        `;

        const query = `
          SELECT 'all' as direction, ${metricsSelect} ${baseQuery}
          UNION ALL
          SELECT direction, ${metricsSelect} ${baseQuery} GROUP BY direction
        `;

        const results = await queryDuckDB<Record<string, string | number | null>>(query);

        // Fetch Buy and Hold Return
        let buyAndHoldReturn = 0;
        try {
          const bhQuery = await queryDuckDB<Record<string, number>>(`
            SELECT 
              ((last(close) - first(open)) / first(open)) * 100 as bh
            FROM (SELECT open, close FROM candles ORDER BY timestamp ASC)
          `);
          if (bhQuery.length > 0) {
            buyAndHoldReturn = Number(bhQuery[0].bh || 0);
          }
        } catch {
          console.warn("Could not calculate Buy & Hold Return");
        }

        const newSummary: PerformanceSummary = { all: null, long: null, short: null, buyAndHoldReturn };

        results.forEach((r) => {
          const dir = String(r.direction).toLowerCase() as 'all' | 'long' | 'short';
          if (!['all', 'long', 'short'].includes(dir)) return;

          const totalTrades = Number(r.totalTrades || 0);
          const winningTrades = Number(r.winningTrades || 0);
          const grossProfit = Number(r.grossProfit || 0);
          const grossLoss = Math.abs(Number(r.grossLoss || 0));
          const avgWin = Number(r.avgWin || 0);
          const avgLoss = Math.abs(Number(r.avgLoss || 0));

          const percentProfitable = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
          const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 99.99 : 0);
          const ratioAvgWinLoss = avgLoss > 0 ? avgWin / avgLoss : (avgWin > 0 ? 99.99 : 0);

          newSummary[dir] = {
            direction: dir,
            netProfit: Number(r.netProfit || 0),
            grossProfit,
            grossLoss,
            maxDrawdown: Number(r.maxDrawdown || 0),
            totalTrades,
            percentProfitable,
            profitFactor,
            avgTrade: Number(r.avgTrade || 0),
            avgWin,
            avgLoss,
            ratioAvgWinLoss,
            largestWin: Number(r.largestWin || 0),
            largestLoss: Number(r.largestLoss || 0),
            sharpeRatio: Number(r.sharpeRatio || 0),
            sortinoRatio: Number(r.sortinoRatio || 0)
          };
        });

        setSummary(newSummary);

      } catch (err) {
        console.error("Failed to fetch performance summary:", err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [activeDatasetId, filters.session, filters.regime, filters.strategyId]);

  return { summary, isLoading, error };
}