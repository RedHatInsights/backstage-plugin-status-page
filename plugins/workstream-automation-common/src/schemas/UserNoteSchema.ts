import { z } from 'zod/v4';

export const UserNoteSchema = z.object({
  userRef: z.string(),
  note: z.string().default('').optional(),
  editHistory: z.array(
    z.object({ timestamp: z.string(), userRef: z.string(), note: z.string().optional() }),
  ),
});
