import { AuthService, DiscoveryService } from '@backstage/backend-plugin-api';
import { ActionsRegistryService } from '@backstage/backend-plugin-api/alpha';

/**
 * Registers the MCP action to list Scaffolder tasks
 */
export function createListScaffolderTasksAction({
  auth,
  discovery,
  actionsRegistry,
}: {
  auth: AuthService;
  discovery: DiscoveryService;
  actionsRegistry: ActionsRegistryService;
}) {
  actionsRegistry.register({
    name: 'list-scaffolder-tasks',
    title: 'List Scaffolder Tasks',
    description:
      'List recent scaffolder tasks with their status. Returns task IDs, statuses, and creation times. Use this to see recent template executions and their outcomes.',
    schema: {
      input: (z) =>
        z.object({
          dummy: z.any().optional().default(true).describe('No input required'),
        }).passthrough(),
      output: (z) =>
        z.object({
          tasks: z.array(
            z.object({
              id: z.string(),
              status: z.string(),
              createdAt: z.string().optional(),
              templateRef: z.string().optional(),
            }),
          ),
          count: z.number(),
          isError: z.boolean().optional(),
          error: z.string().optional(),
        }),
    },
    async action({ logger }) {
      try {
        logger.info('Listing scaffolder tasks');
        
        const { token } = await auth.getPluginRequestToken({
          onBehalfOf: await auth.getOwnServiceCredentials(),
          targetPluginId: 'scaffolder',
        });

        const baseUrl = await discovery.getBaseUrl('scaffolder');
        const url = `${baseUrl}/v2/tasks`;

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(`API failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const items = Array.isArray(data) ? data : data?.items || [];

        const tasks = items.map((t: any) => ({
          id: t?.id || '',
          status: t?.status || '',
          createdAt: t?.createdAt || '',
          templateRef: t?.spec?.templateInfo?.entityRef || '',
        }));

        logger.info(`Retrieved ${tasks.length} tasks`);
        return { output: { tasks, count: tasks.length } };
      } catch (error) {
        const errorMsg = `Failed to list tasks: ${error instanceof Error ? error.message : String(error)}`;
        logger.error(errorMsg);
        return { output: { tasks: [], count: 0, isError: true, error: errorMsg } };
      }
    },
  });
}

