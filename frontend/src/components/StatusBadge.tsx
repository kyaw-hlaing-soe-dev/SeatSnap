"use client";

import { ReactNode } from "react";

type BadgeTone = "success" | "warning" | "danger" | "neutral";

type StatusBadgeProps = {
  tone: BadgeTone;
  children: ReactNode;
  className?: string;
};

const toneMap: Record<BadgeTone, string> = {
  success: "bg-seatsnap-primary/15 text-seatsnap-primary border-seatsnap-primary/40",
  warning: "bg-seatsnap-warning/15 text-seatsnap-warning border-seatsnap-warning/40",
  danger: "bg-seatsnap-danger/15 text-seatsnap-danger border-seatsnap-danger/40",
  neutral: "bg-white/5 text-seatsnap-text border-white/10"
};

export function StatusBadge({ tone, children, className }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-mono uppercase tracking-wide ${toneMap[tone]} ${className ?? ""}`}
    >
      {children}
    </span>
  );
}
