import { AuthService, DiscoveryService } from '@backstage/backend-plugin-api';
import { ActionsRegistryService } from '@backstage/backend-plugin-api/alpha';

/**
 * Registers the MCP action to get a Scaffolder task status
 */
export function createGetScaffolderTaskAction({
  auth,
  discovery,
  actionsRegistry,
}: {
  auth: AuthService;
  discovery: DiscoveryService;
  actionsRegistry: ActionsRegistryService;
}) {
  actionsRegistry.register({
    name: 'get-scaffolder-task',
    title: 'Get Scaffolder Task Status',
    description:
      'Get the status and details of a scaffolder task. Returns task status, steps, and completion information. Use this to monitor template execution progress.',
    schema: {
      input: (z) =>
        z.object({
          taskId: z.string().describe('REQUIRED: The ID of the scaffolder task to retrieve'),
        }),
      output: (z) =>
        z.object({
          task: z.any().optional(),
          taskId: z.string().optional(),
          status: z.string().optional(),
          steps: z.array(z.any()).optional(),
          isError: z.boolean().optional(),
          error: z.string().optional(),
        }),
    },
    async action({ input, logger }) {
      try {
        if (!input.taskId) {
          throw new Error('taskId is required');
        }

        logger.info(`Getting scaffolder task: ${input.taskId}`);
        
        const { token } = await auth.getPluginRequestToken({
          onBehalfOf: await auth.getOwnServiceCredentials(),
          targetPluginId: 'scaffolder',
        });

        const baseUrl = await discovery.getBaseUrl('scaffolder');
        const url = `${baseUrl}/v2/tasks/${input.taskId}`;

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(`API failed: ${response.status} ${response.statusText}`);
        }

        const task = await response.json();

        logger.info(`Retrieved task ${input.taskId}: status=${task?.status}`);
        return {
          output: {
            task,
            taskId: task?.id || input.taskId,
            status: task?.status,
            steps: task?.steps,
          },
        };
      } catch (error) {
        const errorMsg = `Failed to get task: ${error instanceof Error ? error.message : String(error)}`;
        logger.error(errorMsg);
        return { output: { taskId: input.taskId, isError: true, error: errorMsg } };
      }
    },
  });
}

