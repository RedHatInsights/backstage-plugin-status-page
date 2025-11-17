import { AuthService, DiscoveryService } from '@backstage/backend-plugin-api';
import { ActionsRegistryService } from '@backstage/backend-plugin-api/alpha';

/**
 * Registers the MCP action to cancel a Scaffolder task
 */
export function createCancelScaffolderTaskAction({
  auth,
  discovery,
  actionsRegistry,
}: {
  auth: AuthService;
  discovery: DiscoveryService;
  actionsRegistry: ActionsRegistryService;
}) {
  actionsRegistry.register({
    name: 'cancel-scaffolder-task',
    title: 'Cancel Scaffolder Task',
    description:
      'Cancel a running scaffolder task. Stops the execution of a template and marks the task as cancelled.',
    schema: {
      input: (z) =>
        z.object({
          taskId: z.string().describe('REQUIRED: The ID of the task to cancel'),
        }),
      output: (z) =>
        z.object({
          taskId: z.string().optional(),
          success: z.boolean().optional(),
          isError: z.boolean().optional(),
          error: z.string().optional(),
        }),
    },
    async action({ input, logger }) {
      try {
        if (!input.taskId) {
          throw new Error('taskId is required');
        }

        logger.info(`Cancelling scaffolder task: ${input.taskId}`);
        
        const { token } = await auth.getPluginRequestToken({
          onBehalfOf: await auth.getOwnServiceCredentials(),
          targetPluginId: 'scaffolder',
        });

        const baseUrl = await discovery.getBaseUrl('scaffolder');
        const url = `${baseUrl}/v2/tasks/${input.taskId}/cancel`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(`API failed: ${response.status} ${response.statusText}`);
        }

        logger.info(`Task ${input.taskId} cancelled successfully`);
        return { output: { taskId: input.taskId, success: true } };
      } catch (error) {
        const errorMsg = `Failed to cancel task: ${error instanceof Error ? error.message : String(error)}`;
        logger.error(errorMsg);
        return { output: { taskId: input.taskId, isError: true, error: errorMsg } };
      }
    },
  });
}

