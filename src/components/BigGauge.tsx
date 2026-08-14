import React, { useEffect, useState } from 'react';
import type { RiskTier } from '../lib/types';

interface BigGaugeProps {
  probability: number; // 0-1
  riskTier: RiskTier;
}

const TIER_COLORS: Record<RiskTier, { ring: string; bg: string }> = {
  Low: { ring: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  Medium: { ring: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  High: { ring: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
};

export function BigGauge({ probability, riskTier }: BigGaugeProps) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setAnimated(probability));
    return () => cancelAnimationFrame(raf);
  }, [probability]);

  const c = TIER_COLORS[riskTier] ?? TIER_COLORS.Low;
  const pct = Math.max(0, Math.min(1, animated));

  // SVG semicircle gauge
  const size = 220;
  const stroke = 14;
  const r = 85;
  const cx = size / 2;
  const cy = size / 2 + 10;

  // Arc from 180° (left) to 0° (right) — semicircle
  const describeArc = (startDeg: number, endDeg: number) => {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startDeg));
    const y1 = cy - r * Math.sin(toRad(startDeg));
    const x2 = cx + r * Math.cos(toRad(endDeg));
    const y2 = cy - r * Math.sin(toRad(endDeg));
    const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 0 ${x2} ${y2}`;
  };

  const bgPath = describeArc(180, 0);
  const fillEndDeg = 180 - pct * 180;
  const fillPath = pct > 0.005 ? describeArc(180, fillEndDeg) : '';

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
        <svg
          width={size}
          height={size / 2 + 20}
          viewBox={`0 0 ${size} ${size / 2 + 20}`}
          className="overflow-visible"
        >
          {/* Track */}
          <path
            d={bgPath}
            fill="none"
            stroke="#e0e3e5"
            strokeWidth={stroke}
            strokeLinecap="round"
          />

          {/* Filled arc */}
          {fillPath && (
            <path
              d={fillPath}
              fill="none"
              stroke={c.ring}
              strokeWidth={stroke}
              strokeLinecap="round"
              style={{
                transition: 'all 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                filter: `drop-shadow(0 0 6px ${c.ring}50)`,
              }}
            />
          )}

          {/* Tick marks */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const angle = (180 - t * 180) * (Math.PI / 180);
            const ir = r + stroke / 2 + 4;
            const or = ir + 6;
            return (
              <line
                key={t}
                x1={cx + ir * Math.cos(angle)}
                y1={cy - ir * Math.sin(angle)}
                x2={cx + or * Math.cos(angle)}
                y2={cy - or * Math.sin(angle)}
                stroke="#c4c6cf"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {/* Center percentage */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <span
            className="text-5xl font-extrabold tracking-tighter leading-none"
            style={{ color: c.ring, transition: 'color 0.5s ease' }}
          >
            {Math.round(pct * 100)}
            <span className="text-2xl font-bold">%</span>
          </span>
        </div>
      </div>

      {/* Label */}
      <p className="text-[11px] font-semibold text-[#74777f] uppercase tracking-widest mt-2">
        Readmission Risk
      </p>

      {/* Tier badge */}
      <span
        className="mt-2.5 px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
        style={{ backgroundColor: c.bg, color: c.ring }}
      >
        {riskTier} Risk
      </span>
    </div>
  );
}
