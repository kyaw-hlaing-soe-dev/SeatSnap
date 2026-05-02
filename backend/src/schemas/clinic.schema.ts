import { z } from "zod";

export const clinicQuerySchema = z
  .object({
    clinicId: z.coerce.number().int().positive().optional(),
  })
  .strict();

export type ClinicQuery = z.infer<typeof clinicQuerySchema>;
