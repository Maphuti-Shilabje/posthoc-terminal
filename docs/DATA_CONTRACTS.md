# 1. Market Data Contract (`candles.csv`)
*The foundation of the visual replay.*

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `timestamp` | `int64` | Unix Epoch (milliseconds). Primary Key for syncing. |
| `open` | `float` | |
| `high` | `float` | |
| `low` | `float` | |
| `close` | `float` | |
| `volume` | `float` | |
| `vwap` | `float` | (Optional) For anchor-point analysis. |
| `session` | `string` | Tag: `london`, `new_york`, `asia`, `gap`. |
| `regime` | `string` | Tag: `trending_up`, `trending_down`, `ranging`, `high_vol`. |

---

# 2. Trade Ledger Contract (`trades.csv`)
*Covers both Executed and Rejected (Graveyard) trades.*

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `trade_id` | `string` | Unique UUID or Hash. |
| `status` | `string` | `executed` or `rejected`. |
| `direction` | `string` | `long` or `short`. |
| `entry_time` | `int64` | Unix Epoch (ms). Links to `candles.timestamp`. |
| `exit_time` | `int64` | Unix Epoch (ms). (Null for rejected trades). |
| `entry_price` | `float` | Actual or theoretical entry. |
| `exit_price` | `float` | |
| `stop_loss` | `float` | Original SL at entry. |
| `take_profit` | `float` | Original TP at entry. |
| `size` | `float` | Position size in units/lots. |
| `pnl_raw` | `float` | Gross profit/loss in currency. |
| `pnl_rel` | `float` | PnL in R-multiple or Percentage. |
| `mae` | `float` | **Maximum Adverse Excursion** (deepest drawdown while open). |
| `mfe` | `float` | **Maximum Favorable Excursion** (highest peak while open). |
| `slippage` | `float` | Difference between requested and filled price. |
| `commission` | `float` | Total transaction cost. |
| `rejection_reason`| `string` | (Graveyard only) e.g., `spread_filter`, `htf_alignment`. |
| `strategy_id` | `string` | For multi-run comparison. |
| `model_version` | `string` | Git hash or version of the logic used. |

---

# 3. Factor & Signal DNA Contract (`signals.csv`)
*The "Why" behind the decision. Links to a Trade ID.*

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `trade_id` | `string` | Foreign Key to `trades.trade_id`. |
| `factor_name` | `string` | Name of signal/indicator (e.g., `rsi_14`, `atr_mult`). |
| `factor_value` | `float` | The value at the exact moment of the signal. |
| `factor_threshold`| `float` | The limit that triggered the signal/rejection. |
| `contribution` | `float` | (Optional) Influence score (e.g., SHAP value) on the decision. |

---

# 4. Simulation & Monte Carlo Contract (`simulations.csv`)
*For the Quant Lab; usually the output of a parameter sweep.*

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `run_id` | `string` | Unique ID for the simulation set. |
| `iteration` | `int` | Loop index (1 to 10,000). |
| `total_return` | `float` | Final PnL for this specific random path. |
| `max_drawdown` | `float` | Deepest DD for this specific random path. |
| `sharpe_ratio` | `float` | |
| `win_rate` | `float` | |
| `is_ruined` | `bool` | Did this path hit the "Total Ruin" threshold? |

---

# 5. Global Metadata Contract (`metadata.json`)
*A small manifest file to configure the terminal shell.*

```json
{
  "project_name": "Emasculate Alpha v2",
  "symbol": "BTCUSDT",
  "base_currency": "USD",
  "timeframe": "15m",
  "start_date": 1704067200000,
  "end_date": 1711929600000,
  "parameters": {
    "atr_period": 14,
    "risk_per_trade": 0.01,
    "min_liquidity": 500000
  },
  "visual_config": {
    "main_indicator": "vwap",
    "theme_color": "#00ff88"
  }
}
```

---

# Data Integrity Constraints (For Engineering)

1.  **Timestamp Continuity:** The `candles.csv` must be contiguous. If there are gaps (e.g., weekends), the terminal must detect them to prevent the UI from "stretching" the chart.
2.  **Trade-to-Candle Linkage:** Every `entry_time` in `trades.csv` **must** have a corresponding `timestamp` in `candles.csv`. (The Terminal's Teleport engine will fail if it can't find the target coordinate).
3.  **Floating Point Precision:** Prices should be stored as `floats`, but currency values (PnL) should be handled as `strings` or `integers` (cents) if you require 100% accounting accuracy to avoid JS floating-point errors.
4.  **The "Graveyard" Nulls:** If `status == rejected`, the terminal logic must handle `exit_time` as `null` and instead use a `theoretical_exit_time` if calculating opportunity cost.
