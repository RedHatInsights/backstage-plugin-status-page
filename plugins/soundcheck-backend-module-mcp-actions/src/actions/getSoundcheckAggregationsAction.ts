import { AuthService, DiscoveryService } from '@backstage/backend-plugin-api';
import { ActionsRegistryService } from '@backstage/backend-plugin-api/alpha';
import { SoundcheckClient } from '../api/soundcheckClient';
import { buildAggregationFilter } from '../utils/helpers';
import type { GetSoundcheckAggregationsInput } from '../types';

/**
 * Registers the MCP action to get Soundcheck aggregations
 */
export function createGetSoundcheckAggregationsAction({
  auth,
  discovery,
  actionsRegistry,
}: {
  auth: AuthService;
  discovery: DiscoveryService;
  actionsRegistry: ActionsRegistryService;
}) {
  actionsRegistry.register({
    name: 'get-soundcheck-aggregations',
    title: 'Get Soundcheck Aggregations',
    description: 'Get aggregated statistics and pass rates across entities/checks/tracks. Returns metrics, trends, and compliance percentages. If user provides track/check names instead of IDs, call list-soundcheck-info first to resolve IDs. Supports filtering by entity kinds/types/lifecycles and time periods.',
    schema: {
      input: (z) =>
        z.object({
          type: z
            .enum([
              'individualCheckPassRates',
              'overallCheckPassRates',
              'individualEntitiesPassRates',
              'overallEntityPassRates',
              'individualTracksPassRates',
              'overallTrackPassRates',
              'groupsPassRates',
            ])
            .describe('REQUIRED: Type of aggregation.'),
          numberOfDays: z
            .number()
            .describe('Optional: Number of days of history (e.g., 7, 30).')
            .optional(),
          entityKinds: z
            .array(z.string())
            .describe('Optional: Entity kinds (e.g., ["Component", "System"]).')
            .optional(),
          entityTypes: z
            .array(z.string())
            .describe('Optional: Entity types (e.g., ["service", "library"]).')
            .optional(),
          entityLifecycles: z
            .array(z.string())
            .describe('Optional: Entity lifecycles (e.g., ["production"]).')
            .optional(),
          tracks: z
            .array(z.string())
            .describe('Optional: Exact track IDs (e.g., ["catalog-health"]). Use values as-is.')
            .optional(),
          checkIds: z
            .array(z.string())
            .describe('Optional: Exact check IDs (e.g., ["has-active-owner-check"]). Use values as-is.')
            .optional(),
          entityRefs: z
            .array(z.string())
            .describe('Optional: Exact entity refs (e.g., ["component:default/my-service"]). Use values as-is.')
            .optional(),
        }),
      output: (z) =>
        z.object({
          aggregation: z.any().optional(),
          type: z.string().optional(),
          isError: z.boolean().optional(),
          error: z.string().optional(),
        }),
    },
    async action({ input, logger }) {
      try {
        logger.info(`Retrieving Soundcheck aggregation of type: ${input.type}`);
        
        const client = new SoundcheckClient(auth, discovery);
        const filter = buildAggregationFilter(input as GetSoundcheckAggregationsInput);
        
        const requestBody = {
          type: input.type,
          ...(filter && { filter }),
        };

        const data = await client.getAggregations(requestBody);
        logger.info(`Successfully retrieved aggregation of type: ${input.type}`);

        return {
          output: {
            aggregation: data,
            type: input.type,
          },
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Soundcheck aggregation retrieval failed: ${errorMessage}`);
        
        return {
          output: {
            isError: true,
            error: `Failed to retrieve Soundcheck aggregation: ${errorMessage}`,
          },
        };
      }
    },
  });
}

