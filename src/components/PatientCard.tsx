"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { PatientSummary } from "@/lib/types";
import { ChevronRight, RotateCw } from "lucide-react";
import { usePrediction } from "../lib/riskService";
import { calculateAge } from "../utils";

export function PatientCard({
  patient,
  index,
}: {
  patient: PatientSummary;
  index: number;
}) {
  const { risk, loading, refresh } = usePrediction(patient.patient_id);

  const getRiskColor = (tier?: string) => {
    if (tier === 'High') return 'bg-red-600 text-white';
    if (tier === 'Medium') return 'bg-orange-500 text-white';
    if (tier === 'Low') return 'bg-green-600 text-white';
    return 'bg-gray-200 text-gray-700';
  };

  const getRiskProgressColor = (tier?: string) => {
    if (tier === 'High') return 'bg-red-600';
    if (tier === 'Medium') return 'bg-orange-500';
    if (tier === 'Low') return 'bg-green-600';
    return 'bg-gray-300';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.4), duration: 0.4 }}
    >
      <Link
        href={`/patients/${patient.patient_id}`}
        className="group block rounded-2xl glass p-5 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-lift bg-white border border-gray-100"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-bold text-gray-900">
              {patient.external_ref || patient.patient_id.substring(0, 8)}
            </p>
            <p className="mt-0.5 text-sm text-gray-600">
              {patient.primary_diagnosis || patient.condition || 'General Observation'}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              Age {patient.age_band || calculateAge(patient.dob)}
            </p>
          </div>
          
          <button 
            onClick={(e) => { e.preventDefault(); refresh(); }}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="Refresh ML Risk"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {loading && !risk ? (
            <div className="animate-pulse flex items-center justify-between">
              <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
              <div className="h-2 w-24 bg-gray-200 rounded-full"></div>
            </div>
          ) : risk ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md ${getRiskColor(risk.riskTier)}`}>
                  {risk.riskTier} Risk
                </span>
                <span className="text-xs font-semibold text-gray-600">
                  {Math.round(risk.probability * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-1000 ${getRiskProgressColor(risk.riskTier)}`} 
                  style={{ width: `${Math.round(risk.probability * 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md bg-gray-100 text-gray-500">
                Unscored
              </span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end border-t border-gray-100">
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-gray-400 uppercase tracking-wider transition group-hover:text-blue-600">
              Details
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
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
