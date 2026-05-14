'use client';

import React, { useRef } from 'react';
import * as duckdb from '@duckdb/duckdb-wasm';
import { getDuckDB } from '@/engine/duckdb';
import { useGlobalStore } from '@/engine/state';
import { Upload, Plus } from 'lucide-react';

export function Uploader() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setActiveDatasetId = useGlobalStore((state) => state.setActiveDatasetId);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const db = await getDuckDB();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const tableName = file.name.replace('.csv', '').toLowerCase(); // e.g., candles, trades, signals

      // Register file to DuckDB-Wasm virtual file system
      await db.registerFileHandle(file.name, file, duckdb.DuckDBDataProtocol.BROWSER_FILEREADER, true);

      const conn = await db.connect();
      try {
        // Create table from CSV using the auto-reader
        await conn.query(`CREATE OR REPLACE TABLE ${tableName} AS SELECT * FROM read_csv_auto('${file.name}')`);
        console.log(`Loaded table [${tableName}] into DuckDB.`);
      } catch (e) {
        console.error(`Failed to load ${file.name}`, e);
      } finally {
        await conn.close();
      }
    }

    // Trigger state update to broadcast that a dataset is ready
    setActiveDatasetId('dataset_' + Date.now());
  };

  return (
    <div>
      <input 
        type="file" 
        multiple 
        accept=".csv,.parquet" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileUpload}
      />
      
      {/* Desktop: Full text button */}
      <button 
        onClick={() => fileInputRef.current?.click()}
        className="hidden sm:flex items-center gap-2 bg-gray-800 text-emerald-400 px-3 py-1 rounded hover:bg-gray-700 transition-colors border border-gray-700 hover:border-emerald-500 shadow-sm text-xs font-medium"
        title="Upload CSV or Parquet files"
      >
        <Upload size={14} />
        <span>Upload Snapshots (CSV)</span>
      </button>

      {/* Mobile: Icon-only button */}
      <button 
        onClick={() => fileInputRef.current?.click()}
        className="sm:hidden flex items-center justify-center bg-gray-800 text-emerald-400 w-8 h-8 rounded hover:bg-gray-700 transition-colors border border-gray-700 hover:border-emerald-500 shadow-sm"
        title="Upload CSV files"
        aria-label="Upload files"
      >
        <Plus size={16} strokeWidth={2.5} />
      </button>
    </div>
  );
}