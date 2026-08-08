"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { PatientSummary } from "@/lib/types";
import { RiskBadge, RadialGauge } from "./RiskIndicators";
import { ChevronRight } from "lucide-react";

export function PatientCard({
  patient,
  index,
}: {
  patient: PatientSummary;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.4), duration: 0.4 }}
    >
      <Link
        href={`/patients/${patient.patient_id}`}
        className="group block rounded-2xl glass p-5 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-lift"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-bold text-ink-900">
              {patient.external_ref}
            </p>
            <p className="mt-0.5 text-sm text-ink-700">
              {patient.primary_diagnosis}
            </p>
            <p className="mt-0.5 text-xs text-ink-500">
              Age {patient.age_band}
            </p>
          </div>
          <RadialGauge value={patient.probability} tier={patient.risk_tier} />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <RiskBadge tier={patient.risk_tier} />
          <span className="inline-flex items-center gap-0.5 text-sm font-medium text-ink-500 transition group-hover:text-brand-teal">
            Details
            <ChevronRight className="h-4 w-4" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

export function PatientRow({ patient }: { patient: PatientSummary }) {
  return (
    <Link
      href={`/patients/${patient.patient_id}`}
      className="grid grid-cols-[1fr_1.4fr_0.8fr_auto] items-center gap-4 rounded-xl px-4 py-3 transition hover:bg-ink-900/[0.03]"
    >
      <span className="font-semibold text-ink-900">{patient.external_ref}</span>
      <span className="text-sm text-ink-700">{patient.primary_diagnosis}</span>
      <span className="text-sm text-ink-500">Age {patient.age_band}</span>
      <div className="flex items-center gap-3">
        <RiskBadge tier={patient.risk_tier} />
        <RadialGauge
          value={patient.probability}
          tier={patient.risk_tier}
          size={40}
          stroke={4}
        />
      </div>
    </Link>
  );
}
