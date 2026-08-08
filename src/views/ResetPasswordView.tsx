import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle2, ShieldCheck, Stethoscope } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ResetPasswordViewProps {
  onBackToLogin: () => void;
}

export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth/reset-password',
      });
      if (authError) throw authError;
      setIsSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Check the address and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-[#e0e3e5] shadow-2xl max-w-md w-full p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#316bf3] flex items-center justify-center text-white shadow-lg shadow-[#316bf3]/30">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#191c1e]">CareLink</h1>
            <p className="text-xs text-[#74777f]">Clinical IT Security</p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-[#191c1e] tracking-tight">Reset Password</h2>
          <p className="text-xs text-[#74777f] mt-1">
            Enter your hospital email address to receive an encrypted password reset link.
          </p>
        </div>

        {isSent ? (
          <div className="p-4 bg-[#10b981]/10 border border-[#10b981]/30 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-[#10b981] font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>Reset Link Transmitted</span>
            </div>
            <p className="text-xs text-[#191c1e] leading-relaxed">
              An email containing password recovery instructions has been dispatched to{' '}
              <span className="font-semibold">{email}</span>. Please check your inbox or hospital spam filter.
            </p>
            <button
              type="button"
              onClick={onBackToLogin}
              className="w-full py-2.5 bg-[#316bf3] text-white text-xs font-bold rounded-xl mt-2"
            >
              Return to Physician Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#43474e] uppercase tracking-wider mb-1.5">
                Hospital Email Address *
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

            {error && (
              <div className="p-3 bg-[#ba1a1a]/10 border border-[#ba1a1a]/30 rounded-xl text-xs text-[#ba1a1a] font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#316bf3] hover:bg-[#0051d5] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#316bf3]/25 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : 'Send Reset Instructions'}
            </button>

            <button
              type="button"
              onClick={onBackToLogin}
              className="w-full py-2.5 text-xs font-semibold text-[#43474e] hover:text-[#191c1e] flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Physician Login</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
