import React from 'react';
import { Activity, ShieldCheck, Heart, Stethoscope, ArrowRight } from 'lucide-react';

interface LandingViewProps {
  onLogin: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#f7f9fb] text-[#191c1e]">
      {/* Navbar */}
      <header className="px-6 py-4 flex items-center justify-between bg-white border-b border-[#e0e3e5]">
        <div className="flex items-center gap-2 text-[#022448]">
          <div className="w-8 h-8 rounded-lg bg-[#316bf3] flex items-center justify-center text-white shadow-md">
            <Stethoscope className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">CareLink</span>
        </div>
        <button
          onClick={onLogin}
          className="px-5 py-2 text-sm font-bold text-white bg-[#316bf3] hover:bg-[#0051d5] rounded-full transition-colors shadow-sm"
        >
          Provider Login
        </button>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10b981]/10 text-[#10b981] text-xs font-bold uppercase tracking-wider mb-4">
            <Activity className="w-4 h-4" />
            Next-Generation EHR
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#022448] leading-tight">
            Streamline your clinical workflows with intelligent care management.
          </h1>
          <p className="text-base md:text-lg text-[#43474e] max-w-2xl mx-auto leading-relaxed">
            CareLink provides healthcare professionals with a unified, offline-capable electronic health record system. Empower your practice with smart vitals tracking, bulk appointment management, and automated patient insights.
          </p>
          
          <div className="pt-6">
            <button
              onClick={onLogin}
              className="px-8 py-3.5 bg-[#316bf3] hover:bg-[#0051d5] text-white font-bold rounded-full text-base transition-all shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
            >
              Access Provider Portal
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-5xl w-full">
          {[
            { icon: Heart, title: 'Smart Vitals Monitoring', desc: 'Real-time abnormal vitals flagging and timeline tracking.' },
            { icon: ShieldCheck, title: 'Secure & Offline Ready', desc: 'HIPAA-compliant local data processing with robust encryption.' },
            { icon: Activity, title: 'Automated Reporting', desc: 'Generate End-of-Day clinical summaries in a single click.' }
          ].map((feature, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-[#e0e3e5] shadow-sm text-left">
              <div className="w-12 h-12 bg-[#f2f4f6] rounded-xl flex items-center justify-center text-[#316bf3] mb-4">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#022448] mb-2">{feature.title}</h3>
              <p className="text-sm text-[#43474e] leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-[#74777f]">
        &copy; {new Date().getFullYear()} CareLink Healthcare Systems. All rights reserved.
      </footer>
    </div>
  );
};
