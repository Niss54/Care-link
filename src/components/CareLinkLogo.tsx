import { cn } from "@/lib/utils";

// Inline SVG re-creation of the CareLink bird mark (green→teal gradient).
// Replace `/logo.png` usage with the uploaded asset if you prefer the raster file.
export function CareLinkMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 48"
      className={cn("h-8 w-8", className)}
      role="img"
      aria-label="CareLink"
    >
      <defs>
        <linearGradient id="carelinkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5BBF3F" />
          <stop offset="55%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>
      </defs>
      {/* upper wings */}
      <path d="M4 10 L24 8 L18 20 Z" fill="url(#carelinkGrad)" opacity="0.92" />
      <path d="M60 10 L40 8 L46 20 Z" fill="url(#carelinkGrad)" opacity="0.92" />
      {/* inner raised wings */}
      <path d="M22 6 L31 26 L24 26 Z" fill="url(#carelinkGrad)" />
      <path d="M42 6 L33 26 L40 26 Z" fill="url(#carelinkGrad)" />
      {/* body */}
      <path
        d="M20 28 C26 33 40 33 48 27 C53 24 57 26 58 22 C56 30 50 38 38 40 C28 41 22 36 20 28 Z"
        fill="url(#carelinkGrad)"
      />
    </svg>
  );
}

export function CareLinkLogo({
  className,
  wordmark = true,
}: {
  className?: string;
  wordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <CareLinkMark />
      {wordmark && (
        <span className="text-xl font-extrabold tracking-tight brand-text">
          CareLink
        </span>
      )}
    </span>
  );
}
