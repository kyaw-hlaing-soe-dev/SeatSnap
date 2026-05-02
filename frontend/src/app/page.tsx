"use client";

import { useMemo, useState } from "react";
import { ClinicCard } from "../components/ClinicCard";
import { SkeletonCard } from "../components/SkeletonCard";
import { useClinics } from "../hooks/useClinics";
import axios from "axios";

export default function HomePage() {
  const { data, isLoading, isError, error, refetch } = useClinics();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!data) return [];
    const term = query.trim().toLowerCase();
    if (!term) return data;
    return data.filter((clinic) => clinic.name.toLowerCase().includes(term));
  }, [data, query]);

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
        <div className="rounded-3xl border border-seatsnap-border bg-gradient-to-br from-seatsnap-surface to-seatsnap-bg p-10">
          <p className="text-sm uppercase tracking-[0.4em] text-seatsnap-muted">SeatSnap</p>
          <h1 className="mt-4 font-display text-4xl text-seatsnap-text md:text-5xl">
            Book your clinic slot. No more 5am queues.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-seatsnap-muted">
            Find trusted clinics, pick your slot, and confirm in minutes. Built for busy patients
            across Southeast Asia.
          </p>
          <div className="mt-8">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search clinics by name"
              className="w-full rounded-2xl border border-seatsnap-border bg-seatsnap-bg px-5 py-4 text-seatsnap-text focus:border-seatsnap-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {isLoading &&
            Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)}

          {!isLoading && filtered.length === 0 && (
            <div className="rounded-2xl border border-seatsnap-border bg-seatsnap-surface p-8 text-center text-seatsnap-muted md:col-span-2">
              No clinics match that search.
            </div>
          )}

          {filtered.map((clinic) => (
            <ClinicCard key={clinic.id} clinic={clinic} />
          ))}
        </div>
      </section>
    </main>
  );
}
