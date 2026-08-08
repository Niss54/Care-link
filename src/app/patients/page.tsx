"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { PatientCard, PatientRow } from "@/components/PatientCard";
import { ListSkeleton } from "@/components/Skeletons";
import { SeagullVideo as SeagullGuide } from "@/components/SeagullVideo";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { getPatients } from "@/lib/api";
import type { PatientSummary, RiskTier } from "@/lib/types";
import { Search, LayoutGrid, Rows3, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type TierFilter = "All" | RiskTier;
const TIERS: TierFilter[] = ["All", "High", "Medium", "Low"];

export default function PatientsPage() {
  const { isAuthed, ready } = useRequireAuth();
  const [patients, setPatients] = useState<PatientSummary[] | null>(null);
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState<TierFilter>("All");
  const [view, setView] = useState<"grid" | "table">("grid");

  useEffect(() => {
    if (isAuthed) getPatients().then(setPatients);
  }, [isAuthed]);

  const filtered = useMemo(() => {
    if (!patients) return [];
    const q = query.trim().toLowerCase();
    return patients.filter((p) => {
      const matchesTier = tier === "All" || p.risk_tier === tier;
      const matchesQuery =
        !q ||
        p.external_ref.toLowerCase().includes(q) ||
        p.primary_diagnosis.toLowerCase().includes(q) ||
        p.age_band.toLowerCase().includes(q);
      return matchesTier && matchesQuery;
    });
  }, [patients, query, tier]);

  // Counts are derived from data — never hard-coded.
  const tierCount = (t: TierFilter) =>
    t === "All"
      ? patients?.length ?? 0
      : patients?.filter((p) => p.risk_tier === t).length ?? 0;

  if (!ready || !isAuthed) {
    return (
      <main>
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <ListSkeleton />
        </div>
      </main>
    );
  }

  return (
    <main>
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-extrabold tracking-tight text-ink-900"
            >
              Patient cohort
            </motion.h1>
            <p className="mt-2 max-w-2xl text-ink-500">
              Patients at Hospital X, sorted by readmission risk. Select any
              patient to see the reasoning behind the prediction.
            </p>
          </div>
          <div className="hidden lg:block">
            <div
              className="relative overflow-hidden rounded-2xl"
              style={{ width: 220, aspectRatio: "704 / 478" }}
            >
              <SeagullGuide
                fillParent
              />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by ID, diagnosis, or age band"
              className="w-full rounded-xl border border-ink-900/10 bg-white/70 py-2.5 pl-10 pr-3 text-sm text-ink-900 outline-none transition focus:border-brand-teal"
            />
          </div>

          <div className="flex items-center gap-3">
            <SlidersHorizontal className="h-4 w-4 text-ink-400" />
            <div className="flex flex-wrap gap-2">
              {TIERS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTier(t)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-medium transition",
                    tier === t
                      ? "brand-gradient text-white shadow-soft"
                      : "border border-ink-900/10 text-ink-700 hover:bg-ink-900/5"
                  )}
                >
                  {t}
                  <span className="ml-1.5 opacity-70">{tierCount(t)}</span>
                </button>
              ))}
            </div>

            <div className="ml-1 flex rounded-full border border-ink-900/10 p-0.5">
              <button
                onClick={() => setView("grid")}
                aria-label="Grid view"
                className={cn(
                  "rounded-full p-1.5 transition",
                  view === "grid" ? "bg-ink-900/5 text-ink-900" : "text-ink-400"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("table")}
                aria-label="Table view"
                className={cn(
                  "rounded-full p-1.5 transition",
                  view === "table" ? "bg-ink-900/5 text-ink-900" : "text-ink-400"
                )}
              >
                <Rows3 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mt-8">
          {!patients ? (
            <ListSkeleton />
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl glass p-12 text-center shadow-soft">
              <p className="text-lg font-semibold text-ink-900">
                No matching patients
              </p>
              <p className="mt-1 text-ink-500">
                Try a different search term or clear the tier filter.
              </p>
            </div>
          ) : view === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p, i) => (
                <PatientCard key={p.patient_id} patient={p} index={i} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl glass p-2 shadow-soft">
              <div className="grid grid-cols-[1fr_1.4fr_0.8fr_auto] gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
                <span>Patient</span>
                <span>Diagnosis</span>
                <span>Age</span>
                <span>Risk</span>
              </div>
              <div className="divide-y divide-ink-900/5">
                {filtered.map((p) => (
                  <PatientRow key={p.patient_id} patient={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
