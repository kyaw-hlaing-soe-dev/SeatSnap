"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clinic } from "../types";

type ClinicCardProps = {
  clinic: Clinic;
};

export function ClinicCard({ clinic }: ClinicCardProps) {
  const availableCount = clinic.slots.reduce((sum, slot) => sum + slot.availableCount, 0);

  return (
    <Link href={`/clinics/${clinic.id}`}>
      <motion.div
        whileHover={{ y: -2 }}
        className="group cursor-pointer rounded-2xl border border-seatsnap-border bg-seatsnap-surface p-6 shadow-lg transition-shadow hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
      >
        <h3 className="font-display text-xl text-seatsnap-text">{clinic.name}</h3>
        <p className="mt-2 text-sm text-seatsnap-muted">{clinic.address}</p>
        <div className="mt-6 flex items-center justify-between text-sm text-seatsnap-muted">
          <span>Available slots</span>
          <span className="rounded-full border border-seatsnap-border px-3 py-1 text-seatsnap-primary">
            {availableCount}
          </span>
        </div>
      </motion.div>
    </Link>
  );
}
