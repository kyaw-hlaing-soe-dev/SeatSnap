import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useBookingStore } from "../store/useBookingStore";
import { Reservation } from "../types";

type ReservePayload = {
  slotId: number;
  userId: string;
};

type ReserveResponse = {
  message: string;
  reservationId: number;
  expiresAt: string;
};

type PurchasePayload = {
  reservationId: number;
  userId: string;
};

type PurchaseResponse = {
  message: string;
  reservation: Reservation;
};

export function useReserve() {
  const queryClient = useQueryClient();
  const { setUserId, setActiveReservation, addReservation } = useBookingStore();

  return useMutation({
    mutationFn: async (payload: ReservePayload) => {
      const response = await api.post<ReserveResponse>("/reserve", payload);
      return { payload, data: response.data };
    },
    onSuccess: ({ payload, data }) => {
      const reservation: Reservation = {
        id: data.reservationId,
        userId: payload.userId,
        status: "PENDING",
        expiresAt: data.expiresAt,
        slotId: payload.slotId
      };

      setUserId(payload.userId);
      setActiveReservation(reservation);
      addReservation(reservation);
      toast.success("Slot reserved! 5 minutes to confirm.");
      queryClient.invalidateQueries({ queryKey: ["clinics"] });
    },
    onError: (error: any) => {
      const status = error?.response?.status;
      if (status === 409 || status === 429 || status === 422) {
        return;
      }
      const message = error?.response?.data?.message ?? "Reservation failed";
      toast.error(message);
    }
  });
}

export function usePurchase() {
  const queryClient = useQueryClient();
  const { updateReservationStatus } = useBookingStore();

  return useMutation({
    mutationFn: async (payload: PurchasePayload) => {
      const response = await api.post<PurchaseResponse>("/purchase", payload);
      return { payload, data: response.data };
    },
    onSuccess: ({ data }) => {
      updateReservationStatus(data.reservation.id, "COMPLETED");
      toast.success("Appointment confirmed.");
      queryClient.invalidateQueries({ queryKey: ["clinics"] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message ?? "Purchase failed";
      toast.error(message);
    }
  });
}
