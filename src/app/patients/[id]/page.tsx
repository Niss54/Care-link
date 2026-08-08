"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { BigGauge } from "@/components/BigGauge";
import { ShapChart } from "@/components/ShapChart";
import { RiskBadge } from "@/components/RiskIndicators";
import { PrivacyNote } from "@/components/PrivacyNote";
import { DetailSkeleton } from "@/components/Skeletons";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { getPrediction, sendFeedback } from "@/lib/api";
import { humanizeFeature } from "@/lib/demo-data";
import type { Prediction } from "@/lib/types";
import {
  ArrowLeft,
  Check,
  X,
  Loader2,
  CheckCircle2,
} from "lucide-react";

function plainSummary(p: Prediction): string {
  const top = [...p.top_factors]
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 3);
  const raisers = top.filter((f) => f.impact > 0).map((f) => humanizeFeature(f.feature).toLowerCase());
  const lowerers = top.filter((f) => f.impact < 0).map((f) => humanizeFeature(f.feature).toLowerCase());

  let s = `This patient is at ${p.risk_tier.toLowerCase()} risk of readmission within 30 days`;
  if (raisers.length) s += `, driven mainly by ${listToText(raisers)}`;
  if (lowerers.length) s += `${raisers.length ? ", partly offset by " : ", helped by "}${listToText(lowerers)}`;
  return s + ".";
}

function listToText(items: string[]): string {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export default function PatientDetailPage() {
  const { isAuthed, ready } = useRequireAuth();
  const params = useParams();
  const patientId = String(params.id);

  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState<null | "confirmed" | "overridden">(null);
  const [done, setDone] = useState<null | "confirmed" | "overridden">(null);

  useEffect(() => {
    if (isAuthed) getPrediction(patientId).then(setPrediction);
  }, [isAuthed, patientId]);

  async function act(action: "confirmed" | "overridden") {
    if (!prediction) return;
    setSubmitting(action);
    await sendFeedback({
      prediction_id: prediction.prediction_id,
      action,
      note,
    });
    setSubmitting(null);
    setDone(action);
  }

  if (!ready || !isAuthed) {
    return (
      <main>
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <DetailSkeleton />
        </div>
      </main>
    );
  }

  return (
    <main>
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Link
          href="/patients"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition hover:text-brand-teal"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to cohort
        </Link>

        {!prediction ? (
          <div className="mt-6">
            <DetailSkeleton />
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[340px_1fr]">
            {/* Left: gauge + identity */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl glass p-6 shadow-soft"
            >
              <div className="flex flex-col items-center text-center">
                <p className="text-sm font-medium text-ink-500">
                  {prediction.external_ref}
                </p>
                <div className="my-5">
                  <BigGauge
                    value={prediction.probability}
                    tier={prediction.risk_tier}
                  />
                </div>
                <RiskBadge tier={prediction.risk_tier} />
                <p className="mt-4 text-sm text-ink-500">
                  Model flag:{" "}
                  <span className="font-semibold text-ink-900">
                    {prediction.prediction === 1
                      ? "Likely readmission"
                      : "Unlikely readmission"}
                  </span>
                </p>
              </div>

              <div className="mt-6 border-t border-ink-900/5 pt-4">
                <PrivacyNote />
              </div>
            </motion.div>

            {/* Right: explanation + actions */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="space-y-6"
            >
              <div className="rounded-3xl glass p-6 shadow-soft">
                <h2 className="text-lg font-bold text-ink-900">
                  Why this prediction
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-700">
                  {plainSummary(prediction)}
                </p>
                <div className="mt-6">
                  <ShapChart factors={prediction.top_factors} />
                </div>
              </div>

              <div className="rounded-3xl glass p-6 shadow-soft">
                <h2 className="text-lg font-bold text-ink-900">
                  Clinician review
                </h2>
                <p className="mt-1 text-sm text-ink-500">
                  Confirm the flag or override it with your clinical judgement.
                </p>

                {done ? (
                  <div className="mt-5 flex items-center gap-2 rounded-xl bg-tier-lowBg px-4 py-3 text-sm font-medium text-tier-low">
                    <CheckCircle2 className="h-5 w-5" />
                    Flag {done}. Your feedback was recorded.
                  </div>
                ) : (
                  <>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Optional note (e.g. recent follow-up scheduled, social support in place)…"
                      rows={3}
                      className="mt-4 w-full resize-none rounded-xl border border-ink-900/10 bg-white/70 p-3 text-sm text-ink-900 outline-none transition focus:border-brand-teal"
                    />
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        onClick={() => act("confirmed")}
                        disabled={!!submitting}
                        className="inline-flex items-center gap-2 rounded-xl brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:shadow-glow disabled:opacity-70"
                      >
                        {submitting === "confirmed" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Confirm flag
                      </button>
                      <button
                        onClick={() => act("overridden")}
                        disabled={!!submitting}
                        className="inline-flex items-center gap-2 rounded-xl border border-ink-900/15 px-5 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-900/5 disabled:opacity-70"
                      >
                        {submitting === "overridden" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                        Override
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </main>
  );
}
