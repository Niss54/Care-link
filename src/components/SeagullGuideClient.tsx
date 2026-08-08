"use client";

import dynamic from "next/dynamic";

// 3D content must be client-only — never server-rendered.
const SeagullGuide = dynamic(
  () => import("./SeagullGuide").then((m) => m.SeagullGuide),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <div className="skeleton h-24 w-32 rounded-2xl" />
      </div>
    ),
  }
);

export function SeagullGuideClient(props: {
  tip?: string;
  className?: string;
  height?: number;
}) {
  return <SeagullGuide {...props} />;
}
