import { AuthService, DiscoveryService } from '@backstage/backend-plugin-api';
import { ActionsRegistryService } from '@backstage/backend-plugin-api/alpha';
import { SoundcheckClient } from '../api/soundcheckClient';

/**
 * Registers the MCP action to get Soundcheck check results for entities
 */
export function createGetSoundcheckResultsAction({
  auth,
  discovery,
  actionsRegistry,
}: {
  auth: AuthService;
  discovery: DiscoveryService;
  actionsRegistry: ActionsRegistryService;
}) {
  actionsRegistry.register({
    name: 'get-soundcheck-results',
    title: 'Get Soundcheck Check Results for an Entity',
    description: 'Get compliance check results for an entity. Returns pass/fail status, failure reasons, and summary stats. Requires entityRef="kind:namespace/name". If user provides only name, first call search-catalog to get full entityRef if not then use the get-catalog-entity to get the entityRef.',
    schema: {
      input: (z) =>
        z.object({
          entityRef: z
            .string()
            .describe('REQUIRED: Entity reference in format "kind:namespace/name" (e.g., "component:default/my-service").'),
          checkIds: z
            .array(z.string())
            .describe('Optional: Filter results by specific check IDs (e.g., ["has-readme", "has-owner"]).')
            .optional(),
          scope: z
            .string()
            .describe('Optional: Filter results by scope (e.g., "default").')
            .optional(),
          state: z
            .enum(['passed', 'failed', 'warning', 'not-applicable'])
            .describe('Optional: Filter results by state.')
            .optional(),
        }),
      output: (z) =>
        z.object({
          results: z.array(z.any()).optional(),
          isError: z.boolean().optional(),
          error: z.string().optional(),
        }),
    },
    async action({ input, logger }) {
      try {
        if (!input.entityRef) {
          throw new Error('entityRef is required');
        }

        logger.info(`Retrieving Soundcheck results for entity: ${input.entityRef}`);
        
        const client = new SoundcheckClient(auth, discovery);
        const results = await client.getResults(
          input.entityRef,
          input.checkIds,
          input.scope,
          input.state
        );

        logger.info(`Retrieved ${results.length} results`);

        return { output: { results } };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Soundcheck results retrieval failed: ${errorMessage}`);
        
        return {
          output: {
            isError: true,
            error: `Failed to retrieve Soundcheck results: ${errorMessage}`,
          },
        };
      }
    },
  });
}

