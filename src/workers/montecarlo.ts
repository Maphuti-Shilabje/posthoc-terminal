export type MonteCarloInput = {
  trades: number[];
  iterations: number;
  tradesPerRun: number;
};

export type MonteCarloOutput = {
  paths: number[][];
  maxDrawdowns: number[];
  finalReturns: number[];
};

interface MonteCarloWorker {
  onmessage: ((this: Worker, ev: MessageEvent<MonteCarloInput>) => void) | null;
  postMessage(message: MonteCarloOutput | { error: string }): void;
}

function isWorker(s: typeof globalThis): s is typeof globalThis & MonteCarloWorker {
  return 'postMessage' in s;
}

if (!isWorker(self)) {
  throw new Error('This script must be run as a Web Worker');
}

const ctx = self;

ctx.onmessage = (e: MessageEvent<MonteCarloInput>) => {
  const { trades, iterations, tradesPerRun } = e.data;
  
  if (!trades || trades.length === 0) {
    ctx.postMessage({ error: 'No trades provided' });
    return;
  }

  const finalReturns = new Float64Array(iterations);
  const maxDrawdowns = new Float64Array(iterations);
  
  // Return a sample of paths so we don't crash the main thread.
  const pathsToReturn = Math.min(iterations, 50);
  const samplePaths = Array.from({ length: pathsToReturn }, () => new Float64Array(tradesPerRun));

  for (let i = 0; i < iterations; i++) {
    let currentEquity = 0; // Start baseline 0
    let peakEquity = 0;
    let maxDD = 0;
    
    for (let t = 0; t < tradesPerRun; t++) {
      // Resampling with replacement
      const randomIndex = Math.floor(Math.random() * trades.length);
      const tradeReturn = trades[randomIndex];
      
      currentEquity += tradeReturn;
      
      if (currentEquity > peakEquity) {
        peakEquity = currentEquity;
      }
      
      const drawdown = peakEquity - currentEquity;
      if (drawdown > maxDD) {
        maxDD = drawdown;
      }
      
      if (i < pathsToReturn) {
        samplePaths[i][t] = currentEquity;
      }
    }
    
    finalReturns[i] = currentEquity;
    maxDrawdowns[i] = maxDD;
  }

  ctx.postMessage({
    paths: samplePaths.map(p => Array.from(p)),
    finalReturns: Array.from(finalReturns),
    maxDrawdowns: Array.from(maxDrawdowns),
  });
};