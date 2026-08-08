"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { SeagullVideo as SeagullGuide } from "@/components/SeagullVideo";
import { useAuth } from "@/lib/auth";
import { ArrowRight, ShieldCheck, Network, Activity } from "lucide-react";

const fade = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.5, ease: "easeOut" },
  }),
};

export default function LandingPage() {
  const { isAuthed } = useAuth();
  const cohortHref = isAuthed ? "/patients" : "/login";

  return (
    <main>
      <Navbar />

      <section className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* Left: copy */}
          <div>
            <motion.div
              custom={0}
              variants={fade}
              initial="hidden"
              animate="show"
              className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-medium text-ink-500"
            >
              <Network className="h-3.5 w-3.5 text-brand-teal" />
              Federated learning · privacy-preserving AI
            </motion.div>

            <motion.h1
              custom={1}
              variants={fade}
              initial="hidden"
              animate="show"
              className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-ink-900 sm:text-5xl lg:text-6xl"
            >
              Predicting readmission.
              <br />
              <span className="brand-text">Protecting privacy.</span>
            </motion.h1>

            <motion.p
              custom={2}
              variants={fade}
              initial="hidden"
              animate="show"
              className="mt-5 max-w-xl text-lg leading-relaxed text-ink-500"
            >
              CareLink flags 30-day hospital readmission risk for every patient,
              powered by a federated AI model trained across multiple hospitals
              that never shared a single patient record.
            </motion.p>

            <motion.p
              custom={3}
              variants={fade}
              initial="hidden"
              animate="show"
              className="mt-3 max-w-xl text-base leading-relaxed text-ink-500"
            >
              Each hospital trains the model on its own data; only the model&apos;s
              math is combined on a secure server. The result works even on a
              hospital it never trained on — and explains the reasoning behind
              every prediction, so clinicians stay in control.
            </motion.p>

            <motion.div
              custom={4}
              variants={fade}
              initial="hidden"
              animate="show"
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link
                href={cohortHref}
                className="inline-flex items-center gap-2 rounded-full brand-gradient px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:shadow-glow"
              >
                View patient cohort
                <ArrowRight className="h-4 w-4" />
              </Link>
              {!isAuthed && (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-full border border-ink-900/10 px-6 py-3 text-sm font-semibold text-ink-700 transition hover:bg-ink-900/5"
                >
                  Log in
                </Link>
              )}
            </motion.div>

            <motion.div
              custom={5}
              variants={fade}
              initial="hidden"
              animate="show"
              className="mt-8 grid max-w-lg grid-cols-3 gap-3"
            >
              <Feature icon={<ShieldCheck className="h-4 w-4" />} label="Data stays in place" />
              <Feature icon={<Activity className="h-4 w-4" />} label="Explained with SHAP" />
              <Feature icon={<Network className="h-4 w-4" />} label="Trained across sites" />
            </motion.div>
          </div>

          {/* Right: 3D seagull guide */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative"
          >
            <div className="overflow-hidden rounded-3xl glass p-2 shadow-lift">
              <div
                className="relative overflow-hidden rounded-2xl"
                style={{ aspectRatio: "704 / 478" }}
              >
                <SeagullGuide
                  fillParent
                />
              </div>
              <p className="py-3 text-center text-sm text-ink-500">
                Meet CareLink — your guide through the cohort
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-2xl glass px-3 py-3 shadow-soft">
      <span className="text-brand-teal">{icon}</span>
      <span className="text-xs font-medium leading-tight text-ink-700">
        {label}
      </span>
    </div>
  );
}
