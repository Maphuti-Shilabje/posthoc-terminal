/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');

// Configuration
const NUM_CANDLES = 10000;
const TIMEFRAME_MS = 15 * 60 * 1000; // 15m
const START_TIME = 1704067200000; // Jan 1, 2024
const INITIAL_PRICE = 45000;
const NUM_TRADES = 500;

// Random helpers
const randRange = (min, max) => Math.random() * (max - min) + min;
const randChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const uuid = () => Math.random().toString(36).substring(2, 10);

// output path
const output_folder = '../public/mock_data/';

// Generate Candles
const candles = [];
let currentPrice = INITIAL_PRICE;
const sessions = ['london', 'new_york', 'asia', 'gap'];
const regimes = ['trending_up', 'trending_down', 'ranging', 'high_vol'];

console.log('Generating candles...');
for (let i = 0; i < NUM_CANDLES; i++) {
  const timestamp = START_TIME + (i * TIMEFRAME_MS);
  
  // Random walk
  const change = randRange(-50, 50);
  const open = currentPrice;
  const close = open + change;
  const high = Math.max(open, close) + randRange(0, 30);
  const low = Math.min(open, close) - randRange(0, 30);
  const volume = Math.floor(randRange(10, 500));
  const vwap = open + randRange(-10, 10); // simple fake vwap
  const session = randChoice(sessions);
  const regime = randChoice(regimes);
  
  candles.push({ timestamp, open, high, low, close, volume, vwap, session, regime });
  currentPrice = close;
}

// Write candles.csv
const candlesHeader = 'timestamp,open,high,low,close,volume,vwap,session,regime\n';
const candlesCsv = candlesHeader + candles.map(c => 
  `${c.timestamp},${c.open.toFixed(2)},${c.high.toFixed(2)},${c.low.toFixed(2)},${c.close.toFixed(2)},${c.volume},${c.vwap.toFixed(2)},${c.session},${c.regime}`
).join('\n');
fs.writeFileSync(`${output_folder}candles.csv`, candlesCsv);

// Generate Trades
console.log('Generating trades...');
const trades = [];
const signals = [];
const rejectionReasons = ['spread_filter', 'htf_alignment', 'atr_limit', 'time_of_day'];

for (let i = 0; i < NUM_TRADES; i++) {
  // Pick a random entry candle (leaving room for exit)
  const entryIdx = Math.floor(randRange(0, NUM_CANDLES - 50));
  const entryCandle = candles[entryIdx];
  
  const trade_id = uuid();
  const isRejected = Math.random() < 0.3; // 30% rejected
  const status = isRejected ? 'rejected' : 'executed';
  const direction = randChoice(['long', 'short']);
  const entry_time = entryCandle.timestamp;
  
  const entry_price = entryCandle.close;
  const stop_loss = direction === 'long' ? entry_price - 100 : entry_price + 100;
  const take_profit = direction === 'long' ? entry_price + 200 : entry_price - 200;
  const size = randRange(0.1, 2.5).toFixed(2);
  
  let exit_time = '';
  let exit_price = '';
  let pnl_raw = '';
  let pnl_rel = '';
  let mae = '';
  let mfe = '';
  let slippage = '';
  let commission = '';
  let rejection_reason = '';
  
  // Logic for both Executed and Rejected (theoretical) PnL
  const duration = Math.floor(randRange(1, 40));
  const exitCandle = candles[entryIdx + duration];
  const isWin = Math.random() > 0.5;
  const pnlMultiplier = isWin ? randRange(50, 300) : randRange(-150, -10);
  
  const theoretical_pnl = pnlMultiplier.toFixed(2);
  const theoretical_exit_price = direction === 'long' ? entry_price + pnlMultiplier : entry_price - pnlMultiplier;

  if (isRejected) {
    rejection_reason = randChoice(rejectionReasons);
    pnl_raw = theoretical_pnl; // Theoretical PnL
    exit_price = theoretical_exit_price.toFixed(2);
    // exit_time remains empty string (null) for Graveyard
  } else {
    exit_time = exitCandle.timestamp;
    pnl_raw = theoretical_pnl;
    pnl_rel = (pnlMultiplier / 100).toFixed(2); // R-multiple
    exit_price = theoretical_exit_price.toFixed(2);
    
    // Fake MAE/MFE
    mae = randRange(10, 80).toFixed(2);
    mfe = randRange(20, 150).toFixed(2);
    slippage = randRange(0.5, 3).toFixed(2);
    commission = (size * 2).toFixed(2); // $2 per unit
  }
  
  trades.push({
    trade_id, status, direction, entry_time, exit_time, entry_price: entry_price.toFixed(2), 
    exit_price: exit_price, stop_loss, take_profit, size, pnl_raw, 
    pnl_rel, mae, mfe, slippage, commission, rejection_reason, 
    strategy_id: 'alpha_v2', model_version: 'v2.1.0'
  });
  
  // Generate 2-4 Signals for this trade
  const numSignals = Math.floor(randRange(2, 5));
  const factors = ['rsi_14', 'atr_mult', 'macd_hist', 'vwap_dist'];
  
  for(let j=0; j<numSignals; j++) {
    const factor_name = factors[j % factors.length];
    const factor_value = randRange(10, 90).toFixed(2);
    // threshold logic based on factor name
    let factor_threshold = '';
    if (factor_name === 'rsi_14') factor_threshold = direction === 'long' ? 30 : 70;
    if (factor_name === 'atr_mult') factor_threshold = 2.5;
    
    const contribution = randRange(-1, 1).toFixed(2);
    
    signals.push({
      trade_id, factor_name, factor_value, factor_threshold, contribution
    });
  }
}

// Write trades.csv
const tradesHeader = 'trade_id,status,direction,entry_time,exit_time,entry_price,exit_price,stop_loss,take_profit,size,pnl_raw,pnl_rel,mae,mfe,slippage,commission,rejection_reason,strategy_id,model_version\n';
const tradesCsv = tradesHeader + trades.map(t => 
  `${t.trade_id},${t.status},${t.direction},${t.entry_time},${t.exit_time},${t.entry_price},${t.exit_price},${t.stop_loss},${t.take_profit},${t.size},${t.pnl_raw},${t.pnl_rel},${t.mae},${t.mfe},${t.slippage},${t.commission},${t.rejection_reason},${t.strategy_id},${t.model_version}`
).join('\n');
fs.writeFileSync(`${output_folder}trades.csv`, tradesCsv);

// Write signals.csv
console.log('Generating signals...');
const signalsHeader = 'trade_id,factor_name,factor_value,factor_threshold,contribution\n';
const signalsCsv = signalsHeader + signals.map(s =>
  `${s.trade_id},${s.factor_name},${s.factor_value},${s.factor_threshold},${s.contribution}`
).join('\n');
fs.writeFileSync(`${output_folder}signals.csv`, signalsCsv);

// Generate Parameter Sweep Data (sweeps.csv)
console.log('Generating parameter sweep...');
const sweepData = [];
const atr_grid = [1.0, 1.5, 2.0, 2.5, 3.0];
const rsi_grid = [10, 14, 21, 28, 50];

for (const atr of atr_grid) {
  for (const rsi of rsi_grid) {
    const sharpe = randRange(0.5, 2.8);
    const win_rate = randRange(40, 65);
    sweepData.push({ atr_mult: atr, rsi_len: rsi, sharpe_ratio: sharpe, win_rate });
  }
}

const sweepsHeader = 'atr_mult,rsi_len,sharpe_ratio,win_rate\n';
const sweepsCsv = sweepsHeader + sweepData.map(s => 
  `${s.atr_mult},${s.rsi_len},${s.sharpe_ratio.toFixed(2)},${s.win_rate.toFixed(1)}`
).join('\n');
fs.writeFileSync(`${output_folder}sweeps.csv`, sweepsCsv);

console.log(`Successfully generated files in ${output_folder}:`);
console.log('- candles.csv (' + NUM_CANDLES + ' rows)');
console.log('- trades.csv (' + NUM_TRADES + ' rows)');
console.log('- signals.csv (' + signals.length + ' rows)');
console.log('- sweeps.csv (' + sweepData.length + ' rows)');
