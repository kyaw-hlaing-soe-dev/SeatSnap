"use client";

import { useMemo } from "react";
import { useBookingStore } from "../../store/useBookingStore";
import { CountdownTimer } from "../../components/CountdownTimer";
import { StatusBadge } from "../../components/StatusBadge";

export default function MyAppointmentsPage() {
  const { reservations, userId, updateReservationStatus, clearActiveReservation } =
    useBookingStore();

  const visible = useMemo(() => {
    if (!userId) return [];
    return reservations.filter((reservation) => reservation.userId === userId);
  }, [reservations, userId]);

  return (
    <main className="min-h-screen px-6 py-16">
      <section className="mx-auto max-w-4xl">
        <div className="rounded-3xl border border-seatsnap-border bg-seatsnap-surface p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-seatsnap-muted">
            My Appointments
          </p>
          <h1 className="mt-3 font-display text-3xl text-seatsnap-text">Your reservations</h1>
          <p className="mt-2 text-seatsnap-muted">
            Saved locally for {userId || "this device"}.
          </p>
        </div>

        {visible.length === 0 && (
          <div className="mt-10 rounded-2xl border border-seatsnap-border bg-seatsnap-surface p-8 text-center text-seatsnap-muted">
            No reservations found yet.
          </div>
        )}

        <div className="mt-10 space-y-4">
          {visible.map((reservation) => (
            <div
              key={reservation.id}
              className="flex flex-col justify-between rounded-2xl border border-seatsnap-border bg-seatsnap-surface p-6 md:flex-row md:items-center"
            >
              <div>
                <p className="font-display text-xl text-seatsnap-text">
                  Reservation #{reservation.id}
                </p>
                <p className="mt-2 text-sm text-seatsnap-muted">Slot #{reservation.slotId}</p>
              </div>
              <div className="mt-4 flex items-center gap-4 md:mt-0">
                {reservation.status === "PENDING" && (
                  <CountdownTimer
                    expiresAt={reservation.expiresAt}
                    className="text-lg"
                    onExpire={() => {
                      updateReservationStatus(reservation.id, "EXPIRED");
                      clearActiveReservation();
                    }}
                  />
                )}
                <StatusBadge
                  tone={
                    reservation.status === "COMPLETED"
                      ? "success"
                      : reservation.status === "EXPIRED"
                        ? "danger"
                        : "warning"
                  }
                >
                  {reservation.status}
                </StatusBadge>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
