import * as duckdb from '@duckdb/duckdb-wasm';

let dbInstance: duckdb.AsyncDuckDB | null = null;
let dbPromise: Promise<duckdb.AsyncDuckDB> | null = null;

export const getDuckDB = async (): Promise<duckdb.AsyncDuckDB> => {
  if (dbInstance) return dbInstance;
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    // Select the appropriate bundle based on browser checks
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
    
    // Instantiate the async version of DuckDB-Wasm
    const worker_url = URL.createObjectURL(
      new Blob([`importScripts("${bundle.mainWorker!}");`], { type: 'text/javascript' })
    );

    const worker = new Worker(worker_url);
    const logger = new duckdb.ConsoleLogger();
    const db = new duckdb.AsyncDuckDB(logger, worker);
    
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    
    URL.revokeObjectURL(worker_url);
    
    dbInstance = db;
    return db;
  })();

  return dbPromise;
};

// Helper for executing simple queries and returning JSON arrays
export const queryDuckDB = async <T = Record<string, string | number | boolean | null | bigint>>(query: string): Promise<T[]> => {
  const db = await getDuckDB();
  const conn = await db.connect();
  try {
    const result = await conn.query(query);
    return result.toArray().map((row) => row.toJSON() as T);
  } finally {
    await conn.close();
  }
};