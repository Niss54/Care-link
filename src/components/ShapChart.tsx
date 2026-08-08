"use client";

import { motion } from "framer-motion";
import type { ShapFactor } from "@/lib/types";
import { humanizeFeature } from "@/lib/demo-data";

export function ShapChart({ factors }: { factors: ShapFactor[] }) {
  const sorted = [...factors].sort(
    (a, b) => Math.abs(b.impact) - Math.abs(a.impact)
  );
  const max = Math.max(...sorted.map((f) => Math.abs(f.impact)), 0.01);

  return (
    <div className="space-y-3">
      {/* center axis labels */}
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="text-tier-low">← Lowers risk</span>
        <span className="text-tier-high">Raises risk →</span>
      </div>

      <div className="space-y-2.5">
        {sorted.map((f, i) => {
          const raises = f.impact > 0;
          const widthPct = (Math.abs(f.impact) / max) * 50; // half-width max
          return (
            <div key={f.feature} className="flex items-center gap-3">
              <span className="w-36 shrink-0 text-right text-sm text-ink-700">
                {humanizeFeature(f.feature)}
              </span>
              <div className="relative h-7 flex-1">
                {/* center line */}
                <div className="absolute left-1/2 top-0 h-full w-px bg-ink-900/10" />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ delay: 0.1 + i * 0.06, duration: 0.6, ease: "easeOut" }}
                  className="absolute top-1/2 h-5 -translate-y-1/2 rounded"
                  style={{
                    left: raises ? "50%" : undefined,
                    right: raises ? undefined : "50%",
                    background: raises ? "#F43F5E" : "#10B981",
                  }}
                />
              </div>
              <span
                className="w-14 shrink-0 text-sm font-semibold tabular-nums"
                style={{ color: raises ? "#F43F5E" : "#10B981" }}
              >
                {f.impact > 0 ? "+" : ""}
                {f.impact.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
