import { z } from "zod";

export const reserveSchema = z
  .object({
    slotId: z.number().int().positive(),
    userId: z.string().min(1),
  })
  .strict();

export const purchaseSchema = z
  .object({
    reservationId: z.number().int().positive(),
    userId: z.string().min(1),
  })
  .strict();
