"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "./supabase";
const DEMO_HOSPITAL_CODE = "HX-7729";
const DEMO_EMAIL = "clinician@hospital-x.org";
const DEMO_PASSWORD = "carelink-demo";
const DEMO_OTP = "424242";
const STORAGE_KEY = "carelink.auth";

export type SessionMode = "demo" | "live";

interface AuthState {
  isAuthed: boolean;
  email: string | null;
  hospital: string | null;
  mode: SessionMode | null;
  ready: boolean;
  verifyHospital: (code: string) => Promise<boolean>;
  verifyCredentials: (email: string, password: string) => Promise<boolean>;
  verifyOtp: (code: string) => Promise<boolean>;
  signOut: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [hospital, setHospital] = useState<string | null>(null);
  const [mode, setMode] = useState<SessionMode | null>(null);
  const [ready, setReady] = useState(false);

  const [pendingHospital, setPendingHospital] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingMode, setPendingMode] = useState<SessionMode>("demo");

  useEffect(() => {
    // Attempt to load demo state or previously saved hospital from sessionStorage
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as {
          email?: string;
          hospital?: string;
          mode?: SessionMode;
        };
        if (parsed.email) setEmail(parsed.email);
        if (parsed.hospital) setHospital(parsed.hospital);
        if (parsed.mode) setMode(parsed.mode);
      }
    } catch {
      /* ignore */
    }

    // Sync with Supabase Auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        setEmail(session.user.email ?? "");
        setMode("live");
        setHospital("CareLink Hospital Network");
      } else if (event === "SIGNED_OUT") {
        setEmail(null);
        setMode(null);
        setHospital(null);
      }
    });

    // Check for an existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setEmail(session.user.email ?? "");
        setMode("live");
        setHospital("CareLink Hospital Network");
      }
      setReady(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const verifyHospital = async (code: string) => {
    await new Promise((r) => setTimeout(r, 300));
    const trimmed = code.trim().toUpperCase();
    if (trimmed === DEMO_HOSPITAL_CODE) {
      setPendingHospital("Hospital X");
      return true;
    }
    return false;
  };

  const verifyCredentials = async (e: string, p: string) => {
    const emailNorm = e.trim().toLowerCase();

    if (emailNorm === DEMO_EMAIL && p === DEMO_PASSWORD) {
      await new Promise((r) => setTimeout(r, 300));
      setPendingEmail(e.trim());
      setPendingMode("demo");
      return true;
    }

    try {
      try {
        await supabase.auth.signOut();
      } catch {
        /* ignore */
      }
      const { data, error } = await supabase.auth.signInWithPassword({
        email: e.trim(),
        password: p,
      });
      
      if (error) throw error;

      setPendingEmail(e.trim());
      setPendingMode("live");
      return true;
    } catch (err) {
      console.error("Supabase sign-in failed:", err);
      return false;
    }
  };

  const verifyOtp = async (code: string) => {
    let ok = false;

    if (pendingMode === "demo") {
      await new Promise((r) => setTimeout(r, 300));
      ok = code.trim() === DEMO_OTP;
    } else {
      // Supabase signInWithPassword already authenticated the user in verifyCredentials.
      // We accept the OTP step in the UI automatically for live mode to avoid breaking the 3-step UI.
      ok = true;
    }

    if (ok && pendingEmail && pendingHospital) {
      setEmail(pendingEmail);
      setHospital(pendingHospital);
      setMode(pendingMode);
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            email: pendingEmail,
            hospital: pendingHospital,
            mode: pendingMode,
          })
        );
      } catch {
        /* ignore */
      }
      setPendingEmail(null);
      setPendingHospital(null);
    }
    return ok;
  };

  const signOut = () => {
    setEmail(null);
    setHospital(null);
    setMode(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    supabase.auth.signOut().catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthed: !!email,
        email,
        hospital,
        mode,
        ready,
        verifyHospital,
        verifyCredentials,
        verifyOtp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function getSessionMode(): SessionMode {
  if (typeof window === "undefined") return "demo";
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return "demo";
    const parsed = JSON.parse(stored) as { mode?: SessionMode };
    return parsed.mode ?? "demo";
  } catch {
    return "demo";
  }
}

export const DEMO_CREDENTIALS = {
  hospitalCode: DEMO_HOSPITAL_CODE,
  email: DEMO_EMAIL,
  password: DEMO_PASSWORD,
  otp: DEMO_OTP,
};
