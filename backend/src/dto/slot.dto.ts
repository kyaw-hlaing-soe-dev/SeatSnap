import { AppointmentSlot } from "../entity/AppointmentSlot";

export interface SlotDTO {
  id: number;
  timeLabel: string;
  availableCount: number;
  category: string;
  clinicId: number;
}

export function toSlotDTO(slot: AppointmentSlot): SlotDTO {
  return {
    id: slot.id,
    timeLabel: slot.timeLabel,
    availableCount: slot.availableCount,
    category: slot.category,
    clinicId: slot.clinicId,
  };
}
