"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useClinics } from "../../../hooks/useClinics";
import { SlotCard } from "../../../components/SlotCard";
import { BookingModal } from "../../../components/BookingModal";
import { useBookingStore } from "../../../store/useBookingStore";
import { SkeletonCard } from "../../../components/SkeletonCard";
import axios from "axios";

export default function ClinicDetailPage() {
  const params = useParams<{ id: string }>();
  const clinicId = Number(params.id);
  const { data, isLoading, isError, error, refetch } = useClinics();
  const { openModal, selectedSlot } = useBookingStore();

  const clinic = useMemo(() => data?.find((item) => item.id === clinicId), [data, clinicId]);

  if (isError && axios.isAxiosError(error) && !error.response) {
    return (
      <main className="min-h-screen px-6 py-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center rounded-3xl border border-seatsnap-border bg-seatsnap-surface p-10 text-center">
          <h1 className="font-display text-3xl text-seatsnap-text">Service unavailable</h1>
          <p className="mt-3 text-seatsnap-muted">
            We cannot reach the clinic service right now. Please try again.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-6 rounded-xl bg-seatsnap-primary px-6 py-3 font-semibold text-seatsnap-bg"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-16">
      <section className="mx-auto max-w-5xl">
        {isLoading && (
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        )}

        {!isLoading && !clinic && (
          <div className="rounded-2xl border border-seatsnap-border bg-seatsnap-surface p-8 text-center text-seatsnap-muted">
            Clinic not found.
          </div>
        )}

        {!isLoading && clinic && (
          <>
            <div className="rounded-3xl border border-seatsnap-border bg-seatsnap-surface p-8">
              <p className="text-sm uppercase tracking-[0.3em] text-seatsnap-muted">Clinic</p>
              <h1 className="mt-3 font-display text-3xl text-seatsnap-text">{clinic.name}</h1>
              <p className="mt-2 text-seatsnap-muted">{clinic.address}</p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {clinic.slots.map((slot) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  selected={selectedSlot?.id === slot.id}
                  onSelect={openModal}
                />
              ))}
            </div>
          </>
        )}
      </section>
      <BookingModal />
    </main>
  );
}
