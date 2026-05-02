import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { AppointmentSlot, Reservation } from "../types";

type ActiveReservation = {
  id: number;
  expiresAt: string;
  slotId: number;
  userId: string;
  status: Reservation["status"];
};

type BookingState = {
  userId: string;
  setUserId: (userId: string) => void;
  modalOpen: boolean;
  selectedSlot: AppointmentSlot | null;
  openModal: (slot: AppointmentSlot) => void;
  closeModal: () => void;
  activeReservation: ActiveReservation | null;
  setActiveReservation: (reservation: ActiveReservation) => void;
  clearActiveReservation: () => void;
  reservations: Reservation[];
  addReservation: (reservation: Reservation) => void;
  updateReservationStatus: (id: number, status: Reservation["status"]) => void;
};

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      userId: "",
      setUserId: (userId) => set({ userId }),
      modalOpen: false,
      selectedSlot: null,
      openModal: (slot) => set({ modalOpen: true, selectedSlot: slot }),
      closeModal: () => set({ modalOpen: false, selectedSlot: null }),
      activeReservation: null,
      setActiveReservation: (reservation) => set({ activeReservation: reservation }),
      clearActiveReservation: () => set({ activeReservation: null }),
      reservations: [],
      addReservation: (reservation) =>
        set((state) => {
          const existing = state.reservations.find((item) => item.id === reservation.id);
          if (existing) {
            return {
              reservations: state.reservations.map((item) =>
                item.id === reservation.id ? reservation : item
              )
            };
          }
          return { reservations: [reservation, ...state.reservations] };
        }),
      updateReservationStatus: (id, status) =>
        set((state) => ({
          reservations: state.reservations.map((item) =>
            item.id === id ? { ...item, status } : item
          ),
          activeReservation:
            state.activeReservation?.id === id
              ? { ...state.activeReservation, status }
              : state.activeReservation
        }))
    }),
    {
      name: "seatsnap-booking",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
