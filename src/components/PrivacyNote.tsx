import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function PrivacyNote({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-tier-lowBg px-3 py-1.5 text-xs font-medium text-tier-low",
        className
      )}
    >
      <ShieldCheck className="h-3.5 w-3.5" />
      Computed at the edge — no patient data left the hospital
    </div>
  );
}
