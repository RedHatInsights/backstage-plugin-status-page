import { AuthService, CacheService, LoggerService } from '@backstage/backend-plugin-api';
import { ActionsRegistryService } from '@backstage/backend-plugin-api/alpha';

/**
 * Registers the MCP action to get outages
 */
export const createGetOutagesAction = ({
  actionsRegistry,
  cache,
}: {
  actionsRegistry: ActionsRegistryService;
  cache: CacheService;
  auth: AuthService;
  logger: LoggerService;
}) => {
  actionsRegistry.register({
    name: 'get-outages',
    title: 'Get Outages',
    description: 'Lists all outages for a given timeframe.',
    schema: {
      input: z =>
        z.object({
          startDate: z
            .string()
            .describe('The start date of the outage (YYYY-MM-DD)')
            .optional()
            .default(''),
          endDate: z
            .string()
            .describe('The end date of the outage (YYYY-MM-DD)')
            .optional()
            .default(''),
          component: z
            .string()
            .describe('The component of the outage')
            .optional(),
        }),
      output: z =>
        z.object({
          outages: z.array(z.any()).optional(),
          component: z.string().optional(),
          totalItems: z.number().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          isError: z.boolean().optional(),
          error: z.string().optional(),
        }),
    },
    async action({ input, logger }) {
      try {
        const { startDate, endDate, component } = input;
        
        // Get cached outages data
        const cachedData: any = await cache.get('cached-outages-data');
        const allOutages: any = cachedData ? JSON.parse(cachedData) : [];
      
        // Filter outages based on input parameters
        let filteredOutages: any = allOutages;
        
        if (startDate || endDate) {
          filteredOutages = allOutages.filter((outage: any) => {
            const outageDate = new Date(outage.date || outage.created_at);
            if (startDate && outageDate < new Date(startDate)) return false;
            if (endDate && outageDate > new Date(endDate)) return false;
            return true;
          });
        }
        
        if (component) {
          filteredOutages = filteredOutages.filter((outage: any) => 
            outage.component === component || outage.components?.includes(component)
          );
        }
        return {
          output: {
            outages: filteredOutages,
            component,
            totalItems: filteredOutages.length,
            startDate,
            endDate,
          },
        };
      }
      catch (error) {
        logger.error(`Failed to get outages: ${error}`);
        return {
          output: {
            isError: true,
            error: `Failed to get outages: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        };
      }
    }
  });
}; 