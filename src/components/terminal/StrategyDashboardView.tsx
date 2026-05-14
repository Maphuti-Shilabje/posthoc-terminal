'use client';

import React from 'react';
import { OverviewStrip } from './OverviewStrip';
import { PerformanceTable } from './PerformanceTable';
import { DistributionProperties } from '@/components/charts/DistributionProperties';
import { EquityCurve } from '@/components/charts/EquityCurve';

export function StrategyDashboardView() {
  return (
    <div className="h-full w-full flex flex-col bg-[#030712] overflow-hidden">
      {/* Overview Strip remains fixed at the top */}
      <div className="shrink-0">
        <OverviewStrip />
      </div>
      
      {/* Scrollable Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-800 space-y-6">
        
        {/* Top Section: Equity Curve */}
        <div className="h-[400px] bg-gray-950 rounded border border-gray-800 shadow-md">
          <EquityCurve />
        </div>

        {/* Bottom Section: Tables and Distributions */}
        <div className="flex gap-6 h-[600px]">
          {/* Left Column: Performance Table */}
          <div className="flex-[1] min-w-0 shadow-md">
            <PerformanceTable />
          </div>
          
          {/* Right Column: Distribution & Properties */}
          <div className="flex-[1] min-w-0 shadow-md">
            <DistributionProperties />
          </div>
        </div>
        
        {/* Bottom Spacer for breathing room */}
        <div className="h-8" />
      </div>
    </div>
  );
}