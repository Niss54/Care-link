"use client";

import { motion } from "framer-motion";
import type { RiskTier } from "@/lib/types";
import { tierColor } from "@/lib/utils";

export function BigGauge({
  value,
  tier,
}: {
  value: number;
  tier: RiskTier;
}) {
  const c = tierColor(tier);
  const size = 200;
  const stroke = 14;
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
          stroke="rgba(15,30,27,0.07)"
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
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-extrabold"
          style={{ color: c.ring }}
        >
          {Math.round(pct * 100)}%
        </motion.span>
        <span className="text-sm font-medium text-ink-500">
          30-day risk
        </span>
      </div>
    </div>
  );
}
