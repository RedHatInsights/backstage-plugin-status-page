import { ActionsRegistryService } from '@backstage/backend-plugin-api/alpha';
import {
  AuthService,
  CacheService,
  LoggerService,
} from '@backstage/backend-plugin-api';

/**
 * Registers the MCP action to get outage details
 */
export const createGetOutageDetailsAction = ({
  actionsRegistry,
  cache,
}: {
  actionsRegistry: ActionsRegistryService;
  cache: CacheService;
  auth: AuthService;
  logger: LoggerService;
}) => {
  actionsRegistry.register({
    name: 'get-outage-details',
    title: 'Get Outage Details',
    description: 'Gets the details of a given outage.',
    schema: {
      input: z =>
        z.object({
          name: z
            .string()
            .describe('The name of the outage')
            .optional()
            .default(''),
          component: z
            .string()
            .describe('The component of the outage')
            .optional()
            .default(''),
        }),
      output: z =>
        z.object({
          outage: z.any().optional(),
          outageId: z.string().optional(),
          isError: z.boolean().optional(),
          error: z.string().optional(),
        }),
    },
    async action({ input, logger }) {
      try {
        const { name, component } = input;
        // Get cached outages data
        const cachedData: any = await cache.get('cached-outages-data');
        const allOutages: any = cachedData ? JSON.parse(cachedData) : [];

        // Find the specific outage
        const outage = allOutages.find(
          (item: any) =>
            item.name.includes(name) ||
            item.components.find?.includes((component_item: any) =>
              component_item.name.includes(component),
            ),
        );

        if (!outage) {
          return {
            output: {
              isError: true,
              error: `Outage not found with ID}`,
            },
          };
        }

        return {
          output: {
            outage: outage,
          },
        };
      } catch (error) {
        logger.error(`Failed to get outage details: ${error}`);

        return {
          output: {
            isError: true,
            error: `Failed to get outage details: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          },
        };
      }
    },
  });
};
