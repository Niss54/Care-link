"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CareLinkLogo } from "@/components/CareLinkLogo";
import { useAuth, DEMO_CREDENTIALS } from "@/lib/auth";
import {
  Building2,
  Lock,
  Mail,
  Loader2,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  Check,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Step = "hospital" | "credentials" | "otp";

const STEPS: { id: Step; label: string }[] = [
  { id: "hospital", label: "Hospital" },
  { id: "credentials", label: "Identity" },
  { id: "otp", label: "Verify" },
];

export default function LoginPage() {
  const { verifyHospital, verifyCredentials, verifyOtp } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("hospital");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpHint, setShowOtpHint] = useState(false);

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  async function submitHospital() {
    setError("");
    setBusy(true);
    const ok = await verifyHospital(code);
    setBusy(false);
    if (ok) setStep("credentials");
    else setError("That hospital access code isn’t enrolled. Check with your administrator.");
  }

  async function submitCredentials() {
    setError("");
    setBusy(true);
    const ok = await verifyCredentials(email, password);
    setBusy(false);
    if (ok) {
      setStep("otp");
      setShowOtpHint(true);
    } else {
      setError("Those credentials weren’t recognised. Check and try again.");
    }
  }

  async function submitOtp() {
    setError("");
    setBusy(true);
    const ok = await verifyOtp(otp);
    setBusy(false);
    if (ok) router.push("/patients");
    else setError("That passcode is incorrect or expired.");
  }

  async function handleGoogleSignIn() {
    setError("");
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/auth/callback",
      },
    });
    if (error) {
      setError(error.message);
      setBusy(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setError("Please enter your email to reset your password.");
      return;
    }
    setError("");
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/auth/reset-password",
    });
    setBusy(false);
    if (error) {
      setError(error.message);
    } else {
      setError("Password reset email sent! Please check your inbox.");
    }
  }

  const stepVideo: Record<Step, string> = {
    hospital: "/login-video1.mp4",
    credentials: "/login-video2.mp4",
    otp: "/login-video3.mp4",
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* Per-step video background */}
      <AnimatePresence mode="wait">
        <motion.video
          key={step}
          src={stepVideo[step]}
          autoPlay
          loop
          muted
          playsInline
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </AnimatePresence>

      {/* Readability overlay (brand-tinted, like athenahealth) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(6,32,28,0.82), rgba(11,40,40,0.72) 50%, rgba(13,90,80,0.66))",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="rounded-3xl glass p-8 shadow-lift">
          <Link href="/" className="flex justify-center">
            <CareLinkLogo />
          </Link>

          {/* Step indicator */}
          <div className="mt-7 flex items-center justify-center gap-2">
            {STEPS.map((s, i) => {
              const done = i < stepIndex;
              const active = i === stepIndex;
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <div
                    className={[
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition",
                      done
                        ? "brand-gradient text-white"
                        : active
                        ? "border-2 border-brand-teal text-brand-teal"
                        : "border border-ink-900/15 text-ink-400",
                    ].join(" ")}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={[
                        "h-px w-8 transition",
                        done ? "bg-brand-teal" : "bg-ink-900/15",
                      ].join(" ")}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {/* STEP 1 — Hospital code */}
            {step === "hospital" && (
              <StepShell
                key="hospital"
                icon={<Building2 className="h-5 w-5" />}
                title="Enter your hospital access code"
                subtitle="CareLink is restricted to enrolled facilities."
              >
                <Field label="Hospital access code">
                  <Building2 className="field-icon" />
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && submitHospital()}
                    placeholder="HX-7729"
                    autoFocus
                    className="field-input tracking-widest"
                  />
                </Field>
                <SubmitButton busy={busy} onClick={submitHospital} label="Continue" />
              </StepShell>
            )}

            {/* STEP 2 — Credentials */}
            {step === "credentials" && (
              <StepShell
                key="credentials"
                icon={<Mail className="h-5 w-5" />}
                title="Sign in with your credentials"
                subtitle="Authorised hospital staff only."
              >
                <Field label="Email">
                  <Mail className="field-icon" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitCredentials()}
                    placeholder="clinician@hospital-x.org"
                    autoFocus
                    className="field-input"
                  />
                </Field>
                <Field label="Password">
                  <Lock className="field-icon" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitCredentials()}
                    placeholder="••••••••"
                    className="field-input"
                  />
                </Field>
                <div className="flex justify-end">
                  <button
                    onClick={handleForgotPassword}
                    className="text-xs font-medium text-brand-teal hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <SubmitButton busy={busy} onClick={submitCredentials} label="Continue" />
                
                <div className="relative my-2 flex items-center py-2">
                  <div className="flex-grow border-t border-ink-900/10"></div>
                  <span className="mx-4 flex-shrink-0 text-xs text-ink-400">OR</span>
                  <div className="flex-grow border-t border-ink-900/10"></div>
                </div>

                <button
                  onClick={handleGoogleSignIn}
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink-900/10 bg-white py-2.5 text-sm font-semibold text-ink-900 shadow-soft transition hover:bg-ink-50 disabled:opacity-70"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Sign in with Google
                </button>
              </StepShell>
            )}

            {/* STEP 3 — OTP */}
            {step === "otp" && (
              <StepShell
                key="otp"
                icon={<KeyRound className="h-5 w-5" />}
                title="Enter your one-time passcode"
                subtitle="We sent a 6-digit code to your registered device."
              >
                <OtpInput value={otp} onChange={setOtp} onComplete={submitOtp} />
                 {showOtpHint && (
                  <p className="mt-3 text-center text-xs text-ink-400">
                    Demo passcode: {DEMO_CREDENTIALS.otp}
                  </p>
                )}
                <SubmitButton busy={busy} onClick={submitOtp} label="Verify and sign in" />
              </StepShell>
            )}
          </AnimatePresence>

          {error && (
            <p className="mt-4 rounded-lg bg-tier-highBg px-3 py-2 text-sm text-tier-high">
              {error}
            </p>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-ink-400">
            <ShieldCheck className="h-3.5 w-3.5 text-tier-low" />
            Access is restricted, encrypted, and audited
          </div>
        </div>
        {/* Demo hint — remove before real deployment */}
        <p className="mt-4 text-center text-xs leading-relaxed text-white/70">
          Demo access — code {DEMO_CREDENTIALS.hospitalCode} ·{" "}
          {DEMO_CREDENTIALS.email} / {DEMO_CREDENTIALS.password} · OTP{" "}
          {DEMO_CREDENTIALS.otp}
        </p>
      </motion.div>
    </main>
  );
}

function StepShell({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="mt-7"
    >
      <div className="mb-5 flex flex-col items-center text-center">
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-brand-teal/10 text-brand-teal">
          {icon}
        </div>
        <h1 className="text-lg font-bold text-ink-900">{title}</h1>
        <p className="mt-1 text-sm text-ink-500">{subtitle}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </motion.div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink-700">
        {label}
      </label>
      <div className="relative">{children}</div>
    </div>
  );
}

function SubmitButton({
  busy,
  onClick,
  label,
}: {
  busy: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="flex w-full items-center justify-center gap-2 rounded-xl brand-gradient py-2.5 text-sm font-semibold text-white shadow-soft transition hover:shadow-glow disabled:opacity-70"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
      {busy ? "Verifying…" : label}
    </button>
  );
}

function OtpInput({
  value,
  onChange,
  onComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete: () => void;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, " ").slice(0, 6).split("");

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  function setDigit(i: number, d: string) {
    const clean = d.replace(/\D/g, "").slice(-1);
    const next = (value.padEnd(6, " ").slice(0, 6).split("") as string[]);
    next[i] = clean || " ";
    const joined = next.join("").replace(/ /g, "");
    onChange(joined);
    if (clean && i < 5) refs.current[i + 1]?.focus();
  }

  function handleKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i].trim() && i > 0) {
      refs.current[i - 1]?.focus();
    }
    if (e.key === "Enter" && value.length === 6) onComplete();
  }

  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          maxLength={1}
          value={digits[i].trim()}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          className="h-12 w-11 rounded-xl border border-ink-900/10 bg-white/70 text-center text-lg font-bold text-ink-900 outline-none transition focus:border-brand-teal"
        />
      ))}
    </div>
  );
}
