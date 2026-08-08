import React, { useState } from 'react';
import { Stethoscope, Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: () => void;
  onNavigateToReset: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onNavigateToReset }) => {
  const [email, setEmail] = useState('smith@carelink.health');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess();
    }, 600);
  };

  const fillDemoDoctor = () => {
    setEmail('smith@carelink.health');
    setPassword('carelink2023pass');
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-[#e0e3e5] shadow-2xl max-w-4xl w-full overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        {/* Left 40% Branding Panel (MD 5 cols) */}
        <div className="md:col-span-5 bg-gradient-to-br from-[#022448] via-[#1e3a5f] to-[#022448] text-white p-8 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#316bf3_1px,transparent_1px)] [background-size:16px_16px]" />

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#316bf3] flex items-center justify-center text-white shadow-lg shadow-[#316bf3]/30">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">CareLink</h1>
            </div>

            <div className="mt-12 space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-[#adc8f5]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" />
                HIPAA & ISO 27001 Secure Portal
              </span>
              <h2 className="text-2xl font-extrabold leading-tight">
                Clinical Decision Portal & EHR Management
              </h2>
              <p className="text-xs text-[#adc8f5] leading-relaxed">
                Streamlining hospital workflows, patient telemetry monitoring, and instant medical consultations with real-time accuracy.
              </p>
            </div>
          </div>

          {/* Footer badge */}
          <div className="relative z-10 pt-6 border-t border-white/10 text-[11px] text-[#adc8f5] flex items-center justify-between">
            <span>Hospital Network v2.4</span>
            <span>24/7 Clinical Support</span>
          </div>
        </div>

        {/* Right 60% Form Panel (MD 7 cols) */}
        <div className="md:col-span-7 p-8 md:p-10 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-[#191c1e] tracking-tight">Physician Sign In</h2>
              <p className="text-xs text-[#74777f] mt-1">
                Enter your hospital credentials or single sign-on to access patient records.
              </p>
            </div>

            {/* Fill Doctor Credentials Shortcut */}
            <div className="p-3 bg-[#316bf3]/10 border border-[#316bf3]/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#316bf3]" />
                <span className="text-xs font-semibold text-[#191c1e]">Demo Medical Credentials</span>
              </div>
              <button
                type="button"
                onClick={fillDemoDoctor}
                className="text-xs font-bold text-[#316bf3] hover:underline"
              >
                Autofill Dr. Smith
              </button>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#43474e] uppercase tracking-wider mb-1.5">
                  Hospital Email / ID *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#74777f]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@carelink.health"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f2f4f6] border border-[#c4c6cf] rounded-xl text-sm text-[#191c1e] focus:outline-none focus:bg-white focus:border-[#316bf3]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#43474e] uppercase tracking-wider">
                    Password *
                  </label>
                  <button
                    type="button"
                    onClick={onNavigateToReset}
                    className="text-xs font-semibold text-[#316bf3] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#74777f]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full pl-10 pr-10 py-2.5 bg-[#f2f4f6] border border-[#c4c6cf] rounded-xl text-sm text-[#191c1e] focus:outline-none focus:bg-white focus:border-[#316bf3]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#74777f] hover:text-[#191c1e]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-[#43474e]">
                  <input type="checkbox" defaultChecked className="rounded border-[#c4c6cf] text-[#316bf3]" />
                  <span>Remember session on this clinical workstation</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#316bf3] hover:bg-[#0051d5] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#316bf3]/25 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Verifying Credentials...</span>
                ) : (
                  <>
                    <span>Sign In to Clinical Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-[#e0e3e5] text-center">
              <p className="text-xs text-[#74777f]">
                Need technical assistance or account provisioning?{' '}
                <a href="#support" className="text-[#316bf3] font-semibold hover:underline">
                  Contact IT Operations
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
