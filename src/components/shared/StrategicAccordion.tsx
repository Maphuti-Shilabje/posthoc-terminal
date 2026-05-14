'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface StrategicAccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  summary?: React.ReactNode;
  className?: string;
}

export function StrategicAccordion({
  title,
  children,
  defaultOpen = false,
  summary,
  className = "",
}: StrategicAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`flex flex-col border-b border-gray-800 last:border-b-0 ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-2 bg-gray-950 hover:bg-gray-900 transition-colors group select-none"
      >
        <div className="flex items-center gap-2">
          {isOpen ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />}
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-emerald-400 transition-colors">
            {title}
          </span>
        </div>
        {!isOpen && summary && (
          <div className="flex items-center">
            {summary}
          </div>
        )}
      </button>
      {isOpen && (
        <div className="flex-1 overflow-hidden bg-gray-900/20">
          {children}
        </div>
      )}
    </div>
  );
}