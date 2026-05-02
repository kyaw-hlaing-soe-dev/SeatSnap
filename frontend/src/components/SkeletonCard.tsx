"use client";

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-seatsnap-border bg-seatsnap-surface/70 p-5">
      <div className="h-5 w-3/4 animate-pulse rounded bg-white/10" />
      <div className="mt-3 h-4 w-5/6 animate-pulse rounded bg-white/5" />
      <div className="mt-6 h-8 w-1/3 animate-pulse rounded bg-white/10" />
    </div>
  );
}
