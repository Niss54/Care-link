import React, { useEffect, useState } from 'react';
import type { ShapFactor } from '../lib/types';
import { humanizeFeature } from '../lib/demo-data';

interface ShapChartProps {
  factors: ShapFactor[];
}

export function ShapChart({ factors }: ShapChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Sort by absolute impact descending, take top 8
  const sorted = [...factors]
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 8);
    
  const max = Math.max(...sorted.map((f) => Math.abs(f.impact)), 0.01);

  return (
    <div className="space-y-4">
      {/* Center axis labels */}
      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#74777f]">
        <span>← Lowers risk</span>
        <span>Raises risk →</span>
      </div>

      <div className="space-y-3">
        {sorted.map((f, i) => {
          const raises = f.impact > 0;
          const widthPct = (Math.abs(f.impact) / max) * 50; // max width is 50% from center
          
          return (
            <div key={f.feature} className="flex items-center gap-4">
              {/* Feature Name */}
              <span className="w-36 shrink-0 text-right text-xs font-semibold text-[#43474e] truncate" title={humanizeFeature(f.feature)}>
                {humanizeFeature(f.feature)}
              </span>
              
              {/* Bar Area */}
              <div className="relative h-8 flex-1 flex items-center">
                {/* Center line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#c4c6cf]" />
                
                {/* Bar */}
                <div
                  className={`absolute h-5 rounded-sm transition-all duration-700 ease-out`}
                  style={{
                    width: mounted ? `${widthPct}%` : '0%',
                    left: raises ? '50%' : 'auto',
                    right: raises ? 'auto' : '50%',
                    backgroundColor: raises ? '#ef4444' : '#10b981', // red for raises, green for lowers
                    transitionDelay: `${i * 50}ms`
                  }}
                />
              </div>
              
              {/* Value Label */}
              <span
                className="w-12 shrink-0 text-xs font-bold tabular-nums"
                style={{ color: raises ? '#ef4444' : '#10b981' }}
              >
                {raises ? '+' : ''}{f.impact.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
