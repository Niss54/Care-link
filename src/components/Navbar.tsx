"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CareLinkLogo } from "./CareLinkLogo";
import { useAuth } from "@/lib/auth";
import { LogOut, LogIn } from "lucide-react";

export function Navbar() {
  const { isAuthed, signOut, email } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="glass border-b border-ink-900/5">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center" aria-label="CareLink home">
            <CareLinkLogo />
          </Link>

          <nav className="flex items-center gap-2">
            {isAuthed ? (
              <>

                <span className="hidden text-sm text-ink-500 md:inline">
                  {email}
                </span>
                <button
                  onClick={() => {
                    signOut();
                    router.push("/");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink-900/10 px-4 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-900/5"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-full brand-gradient px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:shadow-glow"
              >
                <LogIn className="h-4 w-4" />
                Log in
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
