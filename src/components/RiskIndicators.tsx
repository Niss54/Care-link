"use client";

import { motion } from "framer-motion";
import type { RiskTier } from "@/lib/types";
import { cn, tierColor } from "@/lib/utils";

export function RiskBadge({ tier }: { tier: RiskTier }) {
  const c = tierColor(tier);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        c.bg,
        c.text
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {tier} risk
    </span>
  );
}

export function RadialGauge({
  value,
  tier,
  size = 56,
  stroke = 5,
  showLabel = true,
}: {
  value: number; // 0–1
  tier: RiskTier;
  size?: number;
  stroke?: number;
  showLabel?: boolean;
}) {
  const c = tierColor(tier);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(15,30,27,0.08)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={c.ring}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct) }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      {showLabel && (
        <span
          className="absolute inset-0 flex items-center justify-center text-xs font-bold"
          style={{ color: c.ring }}
        >
          {Math.round(pct * 100)}%
        </span>
      )}
    </div>
  );
}
