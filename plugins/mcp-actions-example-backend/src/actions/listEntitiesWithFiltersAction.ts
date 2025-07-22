import { AuthService } from '@backstage/backend-plugin-api';
import { ActionsRegistryService } from '@backstage/backend-plugin-api/alpha';
import { CatalogApi } from '@backstage/catalog-client';

/**
 * Registers the MCP action to list catalog entities with filters
 */
export function createListEntitiesWithFiltersAction({
  catalog,
  auth,
  actionsRegistry,
}: {
  catalog: CatalogApi;
  auth: AuthService;
  actionsRegistry: ActionsRegistryService;
}) {
  actionsRegistry.register({
    name: 'list-entities',
    title: 'List Catalog Entities',
    description: 'Lists all entities for a given kind using EntityFilterQuery. Supports filtering by kind, namespace, owner, lifecycle, type, and more.',
    schema: {
      input: z =>
        z.object({
          kind: z
            .string()
            .describe('The kind of entities to list (e.g., Component, System, API)')
            .optional(),
          filters: z
            .record(z.string(), z.union([z.string(), z.array(z.string())]))
            .describe('Additional filters like namespace, owner, lifecycle, type, etc.')
            .optional(),
        }),
      output: z =>
        z.object({
          entities: z.array(z.any()).optional(),
          totalCount: z.number().optional(),
          isError: z.boolean().optional(),
          error: z.string().optional(),
        }),
    },
    async action({ input, logger }) {
      try {
        logger.info(`Listing entities with filters: ${JSON.stringify(input)}`);

        const entityFilters: Record<string, any>[] = [];

        if (input.kind) {
          entityFilters.push({ kind: input.kind });
        }

        if (input.filters) {
          for (const [key, value] of Object.entries(input.filters)) {
            if (value !== undefined && value !== null && value !== '') {
              // Handle nested properties like spec.type, metadata.namespace
              entityFilters.push({ [key]: value });
            }
          }
        }

        const { token: catalogServiceToken } = await auth.getPluginRequestToken({
          targetPluginId: 'catalog',
          onBehalfOf: await auth.getOwnServiceCredentials(),
        });

        const result = await catalog.getEntities(
          { 
            filter: entityFilters.length > 0 ? entityFilters : undefined 
          },
          { token: catalogServiceToken }
        );

        logger.info(`Found ${result.items.length} entities`);

        return {
          output: {
            entities: result.items,
            totalCount: result.items.length,
          },
        };
      } catch (error) {
        logger.error(`Entity listing failed: ${error}`);
        
        return {
          output: {
            isError: true,
            error: `Failed to list entities: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        };
      }
    },
  });
}
