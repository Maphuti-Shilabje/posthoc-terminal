import { useState, useEffect } from 'react';
import { queryDuckDB } from '@/engine/duckdb';
import { useGlobalStore } from '@/engine/state';

export interface WeaknessInsight {
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  metric: string;
}

export function useIntelligence() {
  const activeDatasetId = useGlobalStore((state) => state.activeDatasetId);
  const filters = useGlobalStore((state) => state.filters);
  const [insights, setInsights] = useState<WeaknessInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!activeDatasetId) return;

    const runIntelligenceAudit = async () => {
      setIsLoading(true);
      const newInsights: WeaknessInsight[] = [];

      try {
        // 1. Regime Vulnerability Audit
        const regimeConditions = ["t.status = 'executed'"];
        if (filters.strategyId) regimeConditions.push(`t.strategy_id = '${filters.strategyId}'`);
        const regimeWhere = `WHERE ${regimeConditions.join(' AND ')}`;

        const regimeAudit = await queryDuckDB<{ regime: string, session: string, expectancy: number }>(`
          SELECT 
            c.regime, 
            c.session, 
            AVG(t.pnl_raw) as expectancy
          FROM trades t
          JOIN candles c ON t.entry_time = c.timestamp
          ${regimeWhere}
          GROUP BY 1, 2
          HAVING expectancy < 0
          ORDER BY expectancy ASC
          LIMIT 1
        `);

        if (regimeAudit.length > 0) {
          const r = regimeAudit[0];
          newInsights.push({
            type: 'critical',
            title: 'Regime Mismatch',
            description: `Strategy bleeding in ${r.regime} / ${r.session}. Negative expectancy detected.`,
            metric: `$${Number(r.expectancy).toFixed(2)} exp/trade`
          });
        }

        // 2. Heat Leakage Audit
        const heatConditions = ["t.status = 'executed'"];
        if (filters.strategyId) heatConditions.push(`t.strategy_id = '${filters.strategyId}'`);
        const heatWhere = `WHERE ${heatConditions.join(' AND ')}`;

        const heatAudit = await queryDuckDB<{ ratio: number }>(`
          SELECT 
            COUNT(CASE WHEN mae > (SELECT AVG(mae) * 2 FROM trades WHERE status = 'executed' AND pnl_raw > 0) THEN 1 END) * 100.0 / COUNT(*) as ratio
          FROM trades t
          ${heatWhere}
        `);

        if (heatAudit.length > 0 && Number(heatAudit[0].ratio) > 15) {
          newInsights.push({
            type: 'warning',
            title: 'Heat Leakage',
            description: 'Significant portion of trades taking excessive heat relative to target.',
            metric: `${Number(heatAudit[0].ratio).toFixed(1)}% outliers`
          });
        }

        // 3. Filter Efficiency
        const graveyardConditions = [];
        if (filters.strategyId) graveyardConditions.push(`strategy_id = '${filters.strategyId}'`);
        const graveyardWhere = graveyardConditions.length > 0 ? `WHERE ${graveyardConditions.join(' AND ')}` : '';

        const graveyardAudit = await queryDuckDB<{ saved: number, lost: number }>(`
          SELECT 
            SUM(CASE WHEN status = 'rejected' AND pnl_raw < 0 THEN ABS(pnl_raw) ELSE 0 END) as saved,
            SUM(CASE WHEN status = 'rejected' AND pnl_raw > 0 THEN pnl_raw ELSE 0 END) as lost
          FROM trades
          ${graveyardWhere}
        `);

        if (graveyardAudit.length > 0) {
          const { saved, lost } = graveyardAudit[0];
          const ratio = Number(saved) / (Number(lost) || 1);
          newInsights.push({
            type: ratio > 1 ? 'info' : 'warning',
            title: 'Filter Efficiency',
            description: ratio > 1 ? 'Risk filters are net-positive.' : 'Risk filters cutting winners.',
            metric: `${ratio.toFixed(2)}x alpha/risk`
          });
        }

        setInsights(newInsights);
      } catch (e) {
        console.error("Intelligence Audit Failed:", e);
      } finally {
        setIsLoading(false);
      }
    };

    runIntelligenceAudit();
  }, [activeDatasetId, filters.strategyId]);

  return { insights, isLoading };
}