import {
  CacheConfigSchema,
  DurationSchema,
  FilterSchema,
  FrequencySchema,
  HumanDurationSchema,
} from '@spotify/backstage-plugin-soundcheck-common';
import { z } from 'zod';

const CommonConfigSchema = z.object({
  filter: FilterSchema.optional(),
  exclude: FilterSchema.optional(),
  frequency: FrequencySchema.optional(),
  cache: CacheConfigSchema.optional(),
  initialDelay: HumanDurationSchema.or(DurationSchema).optional(),
  batchSize: z.number().min(1).optional(),
});

export const ConfigSchema = CommonConfigSchema.extend({
  googleCredentials: z.string({
    description: 'Google service account credentials',
  }),
  collects: z.array(
    CommonConfigSchema.extend({
      type: z.string({ description: 'Name of fact' }),
      spreadsheetId: z.string({ description: 'Google spreadsheet ID' }),
      range: z.string({ description: 'Range of cells to fetch, eg: A1:Z100' }),
    }),
  ),
});
