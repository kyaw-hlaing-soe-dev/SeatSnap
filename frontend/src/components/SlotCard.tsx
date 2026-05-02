"use client";

import { motion } from "framer-motion";
import { AppointmentSlot } from "../types";
import { StatusBadge } from "./StatusBadge";

type SlotCardProps = {
  slot: AppointmentSlot;
  selected?: boolean;
  onSelect?: (slot: AppointmentSlot) => void;
};

export function SlotCard({ slot, selected, onSelect }: SlotCardProps) {
  const isFull = slot.availableCount === 0;

  const baseClasses =
    "rounded-2xl border bg-seatsnap-surface p-5 transition-all duration-200 text-left";
  const stateClasses = isFull
    ? "border-seatsnap-danger/40 opacity-60 cursor-not-allowed"
    : selected
      ? "border-seatsnap-primary shadow-glow"
      : "border-seatsnap-border hover:border-seatsnap-primary/70";

  const Card = isFull ? "div" : motion.button;

  return (
    <Card
      whileHover={!isFull ? { scale: 1.02 } : undefined}
      className={`${baseClasses} ${stateClasses}`}
      onClick={() => {
        if (!isFull && onSelect) {
          onSelect(slot);
        }
      }}
      disabled={isFull}
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-display text-lg text-seatsnap-text">{slot.timeLabel}</h4>
          <div className="mt-2">
            <StatusBadge tone="neutral">{slot.category}</StatusBadge>
          </div>
        </div>
        {isFull ? (
          <StatusBadge tone="danger">Full</StatusBadge>
        ) : (
          <StatusBadge tone="success">Available</StatusBadge>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-seatsnap-muted">
        <span>Slots left</span>
        <span className={`font-mono text-seatsnap-primary ${!isFull ? "animate-pulseSoft" : ""}`}>
          {slot.availableCount}
        </span>
      </div>
    </Card>
  );
}
