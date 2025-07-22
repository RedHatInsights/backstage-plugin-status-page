import { AuthService } from '@backstage/backend-plugin-api';
import { ActionsRegistryService } from '@backstage/backend-plugin-api/alpha';
import { CatalogApi } from '@backstage/catalog-client';
import { parseEntityRef } from '@backstage/catalog-model';

/**
 * Registers the MCP action to get workstream portfolio
 */
export const createGetWorkstreamPortfolioAction = ({
  catalog,
  auth,
  actionsRegistry,
}: {
  catalog: CatalogApi;
  auth: AuthService;
  actionsRegistry: ActionsRegistryService;
}) => {
  actionsRegistry.register({
    name: 'get-workstream-portfolio',
    title: 'Get Workstream Portfolio',
    description: 'Gets the portfolio entities (system/component) of a given workstream using catalogApi.getEntityByRef() and catalogApi.getEntitiesByRefs().',
    schema: {
      input: z =>
        z.object({
          namespace: z
            .string()
            .describe('The namespace of the workstream (defaults to "default")')
            .optional()
            .default('default'),
          name: z
            .string()
            .describe('The name of the workstream'),
        }),
      output: z =>
        z.object({
          portfolio: z.array(z.any()).optional(),
          workstreamRef: z.string().optional(),
          totalItems: z.number().optional(),
          isError: z.boolean().optional(),
          error: z.string().optional(),
        }),
    },
    async action({ input, logger }) {
      try {
        const { namespace = 'default', name } = input;
        const workstreamRef = `workstream:${namespace}/${name}`;
        
        logger.info(`Getting portfolio for workstream: ${workstreamRef}`);

        const { token: catalogServiceToken } = await auth.getPluginRequestToken({
          targetPluginId: 'catalog',
          onBehalfOf: await auth.getOwnServiceCredentials(),
        });

        const workstreamEntity = await catalog.getEntityByRef(
          { kind: 'workstream', namespace, name },
          { token: catalogServiceToken }
        );

        if (!workstreamEntity) {
          logger.warn(`Workstream not found: ${workstreamRef}`);
          return {
            output: {
              isError: true,
              error: `Workstream not found: ${workstreamRef}`,
            },
          };
        }

        // Identify portfolio items from the workstream spec
        const portfolioRefs = workstreamEntity?.spec?.portfolio;
        
        if (!Array.isArray(portfolioRefs) || portfolioRefs.length === 0) {
          logger.info(`No portfolio items found for workstream: ${workstreamRef}`);
          return {
            output: {
              portfolio: [],
              workstreamRef,
              totalItems: 0,
            },
          };
        }

        // Filter and parse valid entity references
        const stringRefs = portfolioRefs.filter((ref): ref is string => typeof ref === 'string');
        
        if (stringRefs.length === 0) {
          logger.info(`No valid portfolio references found for workstream: ${workstreamRef}`);
          return {
            output: {
              portfolio: [],
              workstreamRef,
              totalItems: 0,
            },
          };
        }

        // Validate entity references
        const validEntityRefs: string[] = [];
        for (const ref of stringRefs) {
          try {
            parseEntityRef(ref); // Validate the reference
            validEntityRefs.push(ref);
          } catch (error) {
            logger.warn(`Invalid entity reference: ${ref}`);
          }
        }

        if (validEntityRefs.length === 0) {
          logger.info(`No valid entity references found for workstream: ${workstreamRef}`);
          return {
            output: {
              portfolio: [],
              workstreamRef,
              totalItems: 0,
            },
          };
        }

        // Fetch details of all portfolio items using catalogApi.getEntitiesByRefs()
        const portfolioEntities = await catalog.getEntitiesByRefs(
          { entityRefs: validEntityRefs },
          { token: catalogServiceToken }
        );

        const validPortfolioEntities = portfolioEntities.items.filter(Boolean);

        logger.info(`Found ${validPortfolioEntities.length} portfolio entities for workstream: ${workstreamRef}`);

        return {
          output: {
            portfolio: validPortfolioEntities,
            workstreamRef,
            totalItems: validPortfolioEntities.length,
          },
        };
      } catch (error) {
        logger.error(`Failed to get workstream portfolio: ${error}`);
        
        return {
          output: {
            isError: true,
            error: `Failed to get workstream portfolio: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        };
      }
    },
  });
}; 