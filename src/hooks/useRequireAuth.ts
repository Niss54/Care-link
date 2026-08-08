"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export function useRequireAuth() {
  const { isAuthed, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !isAuthed) {
      router.replace("/login");
    }
  }, [ready, isAuthed, router]);

  return { isAuthed, ready };
}
