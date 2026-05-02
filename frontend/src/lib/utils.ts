import { v4 as uuidv4 } from "uuid";

const CORRELATION_ID_KEY = "seatsnap-correlation-id";

export function generateCorrelationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return uuidv4();
}

export function getCorrelationId(): string {
  if (typeof window === "undefined") {
    return "server";
  }

  const existing = sessionStorage.getItem(CORRELATION_ID_KEY);
  if (existing) {
    return existing;
  }

  const next = generateCorrelationId();
  sessionStorage.setItem(CORRELATION_ID_KEY, next);
  return next;
}

export function formatCountdown(seconds: number): string {
  const clamped = Math.max(0, seconds);
  const minutes = Math.floor(clamped / 60);
  const remaining = clamped % 60;
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

export function formatTime(label: string): string {
  return label.trim();
}
