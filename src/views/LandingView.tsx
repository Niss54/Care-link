import React from 'react';
import { Stethoscope, ArrowRight, ShieldCheck, Users, Brain, Calendar, BarChart3, Heart } from 'lucide-react';

interface LandingViewProps {
  onLogin: () => void;
}

const FEATURES = [
  {
    icon: Users,
    title: 'Patient Management',
    desc: 'Comprehensive EHR with real-time vitals tracking and clinical notes.',
  },
  {
    icon: Brain,
    title: 'AI-Powered Triage',
    desc: 'Machine learning risk stratification for faster clinical decision-making.',
  },
  {
    icon: Calendar,
    title: 'Smart Appointments',
    desc: 'Intelligent scheduling with conflict detection and automated reminders.',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    desc: 'Real-time dashboards for patient outcomes, department KPIs, and trends.',
  },
];

export const LandingView: React.FC<LandingViewProps> = ({ onLogin }) => {
  return (
    <>
      {/* Keyframe animations */}
      <style>{`
        @keyframes landing-fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes landing-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes landing-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes landing-pulse-ring {
          0%   { transform: scale(1); opacity: .35; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        .anim-fade-up   { animation: landing-fade-up .7s ease-out both; }
        .anim-fade-up-1 { animation: landing-fade-up .7s .15s ease-out both; }
        .anim-fade-up-2 { animation: landing-fade-up .7s .3s ease-out both; }
        .anim-fade-up-3 { animation: landing-fade-up .7s .45s ease-out both; }
        .anim-fade-in   { animation: landing-fade-in 1s .2s ease-out both; }
        .anim-float     { animation: landing-float 4s ease-in-out infinite; }
        .anim-card-0    { animation: landing-fade-up .6s .5s ease-out both; }
        .anim-card-1    { animation: landing-fade-up .6s .65s ease-out both; }
        .anim-card-2    { animation: landing-fade-up .6s .8s ease-out both; }
        .anim-card-3    { animation: landing-fade-up .6s .95s ease-out both; }
      `}</style>

      <div className="min-h-screen flex flex-col bg-[#0f172a] text-white relative overflow-hidden">
        {/* Background radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[50%] translate-x-[-50%] w-[900px] h-[900px] rounded-full bg-[radial-gradient(circle,rgba(49,107,243,.15)_0%,transparent_70%)]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,.08)_0%,transparent_70%)]" />
        </div>

        {/* Subtle dot grid */}
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        {/* ── Navbar ── */}
        <header className="relative z-10 px-6 lg:px-10 py-4 flex items-center justify-between border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#316bf3] flex items-center justify-center shadow-lg shadow-[#316bf3]/30 anim-float">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">CareLink</span>
          </div>
          <button
            onClick={onLogin}
            className="px-5 py-2 text-sm font-bold text-white bg-white/10 hover:bg-white/20 backdrop-blur rounded-full transition-all border border-white/10"
          >
            Provider Login
          </button>
        </header>

        {/* ── Hero Section ── */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Badge */}
            <div className="anim-fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#10b981]/15 text-[#10b981] text-xs font-bold uppercase tracking-wider border border-[#10b981]/20">
              <Heart className="w-3.5 h-3.5 animate-pulse" />
              Next-Generation Clinical Platform
            </div>

            {/* Tagline */}
            <h1 className="anim-fade-up-1 text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              <span className="bg-gradient-to-r from-white via-[#adc8f5] to-[#316bf3] bg-clip-text text-transparent">
                Clinical Intelligence
              </span>
              <br />
              <span className="text-white/90">for Modern Healthcare</span>
            </h1>

            {/* Sub-copy */}
            <p className="anim-fade-up-2 text-sm md:text-base text-[#94a3b8] max-w-2xl mx-auto leading-relaxed">
              CareLink empowers clinicians with AI-driven patient management, real-time vitals monitoring,
              and intelligent scheduling — all in a unified, HIPAA-compliant portal.
            </p>

            {/* CTA */}
            <div className="anim-fade-up-3 pt-4">
              <button
                onClick={onLogin}
                className="group px-8 py-3.5 bg-[#316bf3] hover:bg-[#2558d9] text-white font-bold rounded-full text-base transition-all shadow-xl shadow-[#316bf3]/30 hover:shadow-[#316bf3]/50 flex items-center gap-2.5 mx-auto relative overflow-hidden"
              >
                {/* Pulse ring behind button */}
                <span className="absolute inset-0 rounded-full border-2 border-[#316bf3]" style={{ animation: 'landing-pulse-ring 2s ease-out infinite' }} />
                <span className="relative z-10 flex items-center gap-2">
                  Access Clinical Portal
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </button>
            </div>
          </div>

          {/* ── Feature Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-20 max-w-5xl w-full">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className={`anim-card-${i} group bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-md p-6 rounded-2xl border border-white/[0.08] hover:border-[#316bf3]/40 text-left transition-all duration-300 cursor-default`}
              >
                <div className="w-11 h-11 bg-[#316bf3]/15 group-hover:bg-[#316bf3]/25 rounded-xl flex items-center justify-center text-[#316bf3] mb-4 transition-colors">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">{f.title}</h3>
                <p className="text-xs text-[#94a3b8] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </main>

        {/* ── Trust Badges + Footer ── */}
        <footer className="relative z-10 py-8 border-t border-white/[0.06]">
          {/* Trust row */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-4">
            {[
              'HIPAA Compliant',
              'AES-256 Encrypted',
              'SOC 2 Certified',
            ].map((badge) => (
              <div key={badge} className="flex items-center gap-1.5 text-xs text-[#94a3b8]">
                <ShieldCheck className="w-4 h-4 text-[#10b981]" />
                <span className="font-medium">{badge}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-[11px] text-[#475569]">
            &copy; {new Date().getFullYear()} CareLink Healthcare Systems. All rights reserved.
          </p>
        </footer>
      </div>
    </>
  );
};
