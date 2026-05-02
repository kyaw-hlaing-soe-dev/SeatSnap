"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useBookingStore } from "../store/useBookingStore";
import { CountdownTimer } from "./CountdownTimer";
import { usePurchase, useReserve } from "../hooks/useReservation";

const bookingSchema = z.object({
  userId: z.string().min(1, "Patient name is required")
});

type BookingForm = z.infer<typeof bookingSchema>;

export function BookingModal() {
  const {
    modalOpen,
    selectedSlot,
    closeModal,
    activeReservation,
    clearActiveReservation,
    updateReservationStatus
  } = useBookingStore();
  const [view, setView] = useState<"form" | "reserved" | "confirmed" | "expired">("form");
  const reserveMutation = useReserve();
  const purchaseMutation = usePurchase();

  const form = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      userId: useBookingStore.getState().userId
    }
  });

  const slot = selectedSlot;
  const reservation = activeReservation;
  const canConfirm = reservation && reservation.status === "PENDING";

  useEffect(() => {
    if (!modalOpen) {
      setView("form");
      form.reset({ userId: useBookingStore.getState().userId });
      return;
    }

    if (reservation?.status === "PENDING") {
      setView("reserved");
    } else if (reservation?.status === "COMPLETED") {
      setView("confirmed");
    } else {
      setView("form");
    }
  }, [modalOpen, reservation, form]);

  const handleReserve = async (data: BookingForm) => {
    if (!slot) {
      return;
    }

    try {
      await reserveMutation.mutateAsync({ slotId: slot.id, userId: data.userId });
      setView("reserved");
    } catch (error) {
      const err = error as AxiosError & { validationErrors?: Record<string, string> };
      if (err.validationErrors) {
        Object.entries(err.validationErrors).forEach(([field, message]) => {
          form.setError(field as keyof BookingForm, { message });
        });
        return;
      }
      const message = err.response?.data?.message ?? "Reservation failed";
      toast.error(message);
    }
  };

  const handlePurchase = async () => {
    if (!reservation) {
      return;
    }
    try {
      await purchaseMutation.mutateAsync({
        reservationId: reservation.id,
        userId: reservation.userId
      });
      setView("confirmed");
    } catch {
      return;
    }
  };

  const handleExpire = () => {
    if (!reservation) {
      return;
    }
    updateReservationStatus(reservation.id, "EXPIRED");
    clearActiveReservation();
    setView("expired");
    setTimeout(() => closeModal(), 2000);
  };

  const bookingTitle = useMemo(() => {
    if (!slot) return "Reserve slot";
    return `${slot.timeLabel} • ${slot.category}`;
  }, [slot]);

  const handleClose = () => {
    if (activeReservation?.status !== "PENDING") {
      clearActiveReservation();
    }
    closeModal();
  };

  return (
    <AnimatePresence>
      {modalOpen && slot && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="w-full rounded-t-3xl border border-seatsnap-border bg-seatsnap-surface p-6 sm:w-[520px] sm:rounded-3xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-seatsnap-muted">Booking</p>
                <h3 className="mt-2 font-display text-2xl text-seatsnap-text">{bookingTitle}</h3>
              </div>
              <button
                onClick={handleClose}
                className="rounded-full border border-seatsnap-border px-3 py-1 text-xs text-seatsnap-muted hover:text-seatsnap-text"
              >
                Close
              </button>
            </div>

            {view === "form" && (
              <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(handleReserve)}>
                <div>
                  <label className="text-sm text-seatsnap-muted">Patient Name</label>
                  <input
                    {...form.register("userId")}
                    className="mt-2 w-full rounded-xl border border-seatsnap-border bg-seatsnap-bg px-4 py-3 text-seatsnap-text focus:border-seatsnap-primary focus:outline-none"
                    placeholder="e.g. Aung Myint"
                  />
                  {form.formState.errors.userId && (
                    <p className="mt-2 text-sm text-seatsnap-danger">
                      {form.formState.errors.userId.message}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={reserveMutation.isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-seatsnap-primary py-3 font-semibold text-seatsnap-bg transition hover:opacity-90 disabled:opacity-60"
                >
                  {reserveMutation.isPending && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-seatsnap-bg border-t-transparent" />
                  )}
                  {reserveMutation.isPending ? "Reserving..." : "Reserve slot"}
                </button>
              </form>
            )}

            {view === "reserved" && reservation && (
              <div className="mt-6 space-y-5">
                <div className="rounded-2xl border border-seatsnap-border bg-seatsnap-bg p-4 text-center">
                  <p className="text-sm text-seatsnap-muted">Time remaining</p>
                  <CountdownTimer
                    expiresAt={reservation.expiresAt}
                    onWarning={() => toast.warning("Your reservation expires in 1 minute")}
                    onExpire={handleExpire}
                    className="mt-2"
                  />
                </div>
                <button
                  onClick={handlePurchase}
                  disabled={!canConfirm || purchaseMutation.isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-seatsnap-primary py-3 font-semibold text-seatsnap-bg transition hover:opacity-90 disabled:opacity-60"
                >
                  {purchaseMutation.isPending && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-seatsnap-bg border-t-transparent" />
                  )}
                  {purchaseMutation.isPending ? "Confirming..." : "Confirm Appointment"}
                </button>
              </div>
            )}

            {view === "confirmed" && reservation && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8 text-center"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-seatsnap-primary/20 text-3xl text-seatsnap-primary">
                  ✓
                </div>
                <h4 className="mt-4 font-display text-xl text-seatsnap-text">
                  Appointment confirmed
                </h4>
                <p className="mt-2 text-sm text-seatsnap-muted">
                  Reservation #{reservation.id} is now confirmed.
                </p>
              </motion.div>
            )}

            {view === "expired" && (
              <div className="mt-8 text-center">
                <h4 className="font-display text-xl text-seatsnap-danger">Slot released</h4>
                <p className="mt-2 text-sm text-seatsnap-muted">
                  Your hold expired. Please select another slot.
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
