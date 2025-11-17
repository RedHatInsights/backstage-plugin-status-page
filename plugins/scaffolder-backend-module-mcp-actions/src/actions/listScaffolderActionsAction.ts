import { AuthService, DiscoveryService } from '@backstage/backend-plugin-api';
import { ActionsRegistryService } from '@backstage/backend-plugin-api/alpha';

/**
 * Registers the MCP action to list all available Scaffolder actions
 */
export function createListScaffolderActionsAction({
  auth,
  discovery,
  actionsRegistry,
}: {
  auth: AuthService;
  discovery: DiscoveryService;
  actionsRegistry: ActionsRegistryService;
}) {
  actionsRegistry.register({
    name: 'list-scaffolder-actions',
    title: 'List Scaffolder Actions',
    description:
      'List all installed scaffolder actions in Backstage. Returns action IDs, descriptions, and schemas. These are the building blocks that can be used in software templates to automate workflows and create projects.',
    schema: {
      input: (z) =>
        z.object({
          dummy: z.any().optional().default(true).describe('No input required'),
        }).passthrough(),
      output: (z) =>
        z.object({
          actions: z.array(
            z.object({
              id: z.string(),
              description: z.string(),
              hasInputSchema: z.boolean(),
              hasOutputSchema: z.boolean(),
              inputProperties: z.array(z.string()).optional(),
              outputProperties: z.array(z.string()).optional(),
            }),
          ),
          count: z.number(),
          isError: z.boolean().optional(),
          error: z.string().optional(),
        }),
    },
    async action({ logger }) {
      try {
        logger.info('Listing scaffolder actions');
        
        const { token } = await auth.getPluginRequestToken({
          onBehalfOf: await auth.getOwnServiceCredentials(),
          targetPluginId: 'scaffolder',
        });

        const baseUrl = await discovery.getBaseUrl('scaffolder');
        const url = `${baseUrl}/v2/actions`;

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(`API failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const actionsList = Array.isArray(data) ? data : data?.items || [];
        
        const mappedActions = actionsList.map((a: any) => {
          try {
            const result: Record<string, any> = {
              id: typeof a?.id === 'string' ? a.id : String(a?.id || 'unknown'),
              description: typeof a?.description === 'string' ? a.description : '',
              hasInputSchema: Boolean(a?.schema?.input),
              hasOutputSchema: Boolean(a?.schema?.output),
            };
            
            if (a?.schema?.input?.properties && typeof a.schema.input.properties === 'object') {
              const inputProps = Object.keys(a.schema.input.properties).filter(k => typeof k === 'string');
              if (inputProps.length > 0) {
                result.inputProperties = inputProps;
              }
            }
            
            if (a?.schema?.output?.properties && typeof a.schema.output.properties === 'object') {
              const outputProps = Object.keys(a.schema.output.properties).filter(k => typeof k === 'string');
              if (outputProps.length > 0) {
                result.outputProperties = outputProps;
              }
            }
            
            return result;
          } catch (e) {
            logger.warn(`Error mapping action: ${e instanceof Error ? e.message : String(e)}`);
            return { id: 'unknown', description: '', hasInputSchema: false, hasOutputSchema: false };
          }
        });

        return {
          output: {
            actions: mappedActions as any,
            count: mappedActions.length,
          },
        };
      } catch (error) {
        const errorMsg = `Failed to list actions: ${error instanceof Error ? error.message : String(error)}`;
        logger.error(errorMsg);
        return {
          output: { actions: [], count: 0, isError: true, error: errorMsg },
        };
      }
    },
  });
}

