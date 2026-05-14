export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;
  session: 'london' | 'new_york' | 'asia' | 'gap';
  regime: 'trending_up' | 'trending_down' | 'ranging' | 'high_vol';
}

export interface Trade {
  trade_id: string;
  status: 'executed' | 'rejected';
  direction: 'long' | 'short';
  entry_time: number;
  exit_time: number | null;
  entry_price: number;
  exit_price: number;
  stop_loss: number;
  take_profit: number;
  size: number;
  pnl_raw: number;
  pnl_rel: number;
  mae: number;
  mfe: number;
  slippage: number;
  commission: number;
  rejection_reason?: string;
  strategy_id: string;
  model_version: string;
}

export interface Signal {
  trade_id: string;
  factor_name: string;
  factor_value: number;
  factor_threshold: number;
  contribution?: number;
}

export interface Simulation {
  run_id: string;
  iteration: number;
  total_return: number;
  max_drawdown: number;
  sharpe_ratio: number;
  win_rate: number;
  is_ruined: boolean;
}

export interface Metadata {
  project_name: string;
  symbol: string;
  base_currency: string;
  timeframe: string;
  start_date: number;
  end_date: number;
  parameters: Record<string, number>;
  visual_config: {
    main_indicator: string;
    theme_color: string;
  };
}

export interface TeleportEventPayload {
  timestamp: number;
  price_range: [number, number]; // [min, max]
  context_padding: number;
  timeframe_hint: string;
}

// Raw types for DuckDB results (handling BigInt)
export interface RawCandle {
  timestamp: bigint | number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;
  session: string;
  regime: string;
}

export interface RawTrade {
  trade_id: string;
  status: string;
  direction: string;
  entry_time: bigint | number;
  exit_time: bigint | number | null;
  entry_price: number;
  exit_price: number | null;
  stop_loss: number;
  take_profit: number;
  pnl_raw: number;
  mae: number;
  mfe: number;
}