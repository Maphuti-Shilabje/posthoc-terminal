'use client';

import React, { useState, useRef } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Trade } from '@/types/contracts';
import { useGlobalStore } from '@/engine/state';
import { eventBus } from '@/engine/events';
import { useTrades } from '@/hooks/useTrades';

const columnHelper = createColumnHelper<Trade>();

const columns = [
  columnHelper.accessor('trade_id', {
    header: 'ID',
    cell: info => <span className="font-mono text-[10px] text-gray-500">{info.getValue()?.slice(0, 8) || '-'}</span>,
    size: 70,
  }),
  columnHelper.accessor('direction', {
    header: 'Dir',
    cell: info => {
      const val = info.getValue();
      if (!val) return '-';
      return <span className={val === 'long' ? 'text-emerald-500' : 'text-red-500'}>{val.toUpperCase()}</span>;
    },
    size: 50,
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: info => {
      const val = info.getValue();
      return <span className={val === 'executed' ? 'text-gray-300' : 'text-gray-600 line-through'}>{val}</span>;
    },
    size: 70,
  }),
  columnHelper.accessor('pnl_raw', {
    header: 'PnL ($)',
    cell: info => {
      const val = info.getValue();
      if (val === null || val === undefined) return '-';
      const isWin = val > 0;
      return <span className={isWin ? 'text-emerald-400' : 'text-red-400'}>{val.toFixed(2)}</span>;
    },
    size: 70,
  }),
  columnHelper.accessor('mae', {
    header: 'MAE',
    cell: info => <span className="text-red-400">{info.getValue()?.toFixed(2) || '-'}</span>,
    size: 60,
  }),
  columnHelper.accessor('mfe', {
    header: 'MFE',
    cell: info => <span className="text-emerald-400">{info.getValue()?.toFixed(2) || '-'}</span>,
    size: 60,
  }),
  columnHelper.accessor('rejection_reason', {
    header: 'Filter / Notes',
    cell: info => <span className="text-gray-500 truncate block max-w-[120px]">{info.getValue() || '-'}</span>,
    size: 150,
  }),
];

export function TradeLedger() {
  const activeDatasetId = useGlobalStore((state) => state.activeDatasetId);
  const selectedTradeId = useGlobalStore((state) => state.selectedTradeId);
  const setSelectedTradeId = useGlobalStore((state) => state.setSelectedTradeId);
  
  const { trades: data } = useTrades();
  const [sorting, setSorting] = useState<SortingState>([]);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 24, // High density row height
    overscan: 20,
  });

  const handleRowClick = (trade: Trade) => {
    setSelectedTradeId(trade.trade_id);
    
    // Teleport Engine Execution
    if (trade.entry_time) {
      // Create bounds based on trade details if they exist, otherwise fallback
      const min_price = Math.min(trade.entry_price, trade.exit_price || trade.entry_price, trade.stop_loss || trade.entry_price);
      const max_price = Math.max(trade.entry_price, trade.exit_price || trade.entry_price, trade.take_profit || trade.entry_price);
      
      const price_range: [number, number] = [min_price, max_price];

      eventBus.emit('TELEPORT_EVENT', {
        timestamp: Number(trade.entry_time),
        price_range: price_range,
        context_padding: 50, // candles
        timeframe_hint: 'M15',
      });
    }
  };

  if (!activeDatasetId) {
    return <div className="text-gray-700 flex items-center justify-center h-full pb-8">Waiting for trade payload...</div>;
  }

  return (
    <div className="h-full flex flex-col font-mono text-[11px] overflow-hidden">
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div style={{ minWidth: '550px', height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Table Header */}
          <div className="flex bg-gray-900 border-y border-gray-800 shrink-0">
            {table.getFlatHeaders().map(header => (
              <div 
                key={header.id}
                style={{ width: header.getSize() }}
                className="p-1.5 font-semibold text-gray-400 cursor-pointer select-none hover:bg-gray-800 transition-colors border-r border-gray-800 last:border-r-0 flex items-center justify-between"
                onClick={header.column.getToggleSortingHandler()}
              >
                <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                <span className="text-gray-600">
                  {{
                    asc: ' ↑',
                    desc: ' ↓',
                  }[header.column.getIsSorted() as string] ?? ''}
                </span>
              </div>
            ))}
          </div>

          {/* Virtualized Body */}
          <div 
            ref={tableContainerRef}
            className="flex-1 overflow-y-auto bg-gray-950 scrollbar-thin scrollbar-thumb-gray-800"
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
          {rowVirtualizer.getVirtualItems().map(virtualRow => {
            const row = rows[virtualRow.index];
            const isSelected = row.original.trade_id === selectedTradeId;
            const isRejected = row.original.status === 'rejected';
            
            return (
              <div
                key={row.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className={`flex items-center border-b border-gray-900/50 cursor-pointer transition-colors ${
                  isSelected ? 'bg-emerald-900/30' : 'hover:bg-gray-900/50'
                } ${isRejected ? 'opacity-40' : ''}`}
                onClick={() => handleRowClick(row.original)}
              >
                {row.getVisibleCells().map(cell => (
                  <div 
                    key={cell.id} 
                    style={{ width: cell.column.getSize() }}
                    className="p-1.5 truncate border-r border-gray-900/50 last:border-r-0"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      </div>
      </div>
    </div>
  );
}