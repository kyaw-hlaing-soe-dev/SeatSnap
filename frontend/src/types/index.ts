export interface Clinic {
  id: number;
  name: string;
  address: string;
  slots: AppointmentSlot[];
}

export interface AppointmentSlot {
  id: number;
  timeLabel: string;
  availableCount: number;
  category: "Walk-in" | "Scheduled" | "Emergency";
  clinicId: number;
}

export interface Reservation {
  id: number;
  userId: string;
  status: "PENDING" | "COMPLETED" | "EXPIRED";
  expiresAt: string;
  slotId: number;
}
