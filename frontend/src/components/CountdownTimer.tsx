"use client";

import { useEffect, useRef, useState } from "react";
import { formatCountdown } from "../lib/utils";

type CountdownTimerProps = {
  expiresAt: string;
  onExpire?: () => void;
  onWarning?: () => void;
  className?: string;
};

export function CountdownTimer({ expiresAt, onExpire, onWarning, className }: CountdownTimerProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(() => {
    return Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
  });
  const warnedRef = useRef(false);

  useEffect(() => {
    const tick = () => {
      const next = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
      setSecondsRemaining(next);
      if (next <= 60 && next > 0 && !warnedRef.current) {
        warnedRef.current = true;
        onWarning?.();
      }
      if (next <= 0) {
        onExpire?.();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire, onWarning]);

  const urgent = secondsRemaining <= 60;

  return (
    <div
      className={`font-mono text-3xl tracking-wide ${urgent ? "text-seatsnap-danger" : "text-seatsnap-warning"} ${className ?? ""}`}
    >
      {formatCountdown(secondsRemaining)}
    </div>
  );
}
