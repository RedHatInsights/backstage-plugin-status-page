import { AuthService, DiscoveryService } from '@backstage/backend-plugin-api';
import { ActionsRegistryService } from '@backstage/backend-plugin-api/alpha';

/**
 * Registers the MCP action to get Scaffolder task logs
 */
export function createGetScaffolderTaskLogsAction({
  auth,
  discovery,
  actionsRegistry,
}: {
  auth: AuthService;
  discovery: DiscoveryService;
  actionsRegistry: ActionsRegistryService;
}) {
  actionsRegistry.register({
    name: 'get-scaffolder-task-logs',
    title: 'Get Scaffolder Task Logs',
    description:
      'Retrieve logs for a scaffolder task. Returns step-by-step execution logs and messages from template processing.',
    schema: {
      input: (z) =>
        z.object({
          taskId: z.string().describe('REQUIRED: The ID of the task'),
          after: z
            .number()
            .optional()
            .describe('Optional: Event ID to retrieve logs after this point'),
        }),
      output: (z) =>
        z.object({
          logs: z.array(z.any()).optional(),
          taskId: z.string().optional(),
          isError: z.boolean().optional(),
          error: z.string().optional(),
        }),
    },
    async action({ input, logger }) {
      try {
        if (!input.taskId) {
          throw new Error('taskId is required');
        }

        logger.info(`Getting logs for task: ${input.taskId}`);
        
        const { token } = await auth.getPluginRequestToken({
          onBehalfOf: await auth.getOwnServiceCredentials(),
          targetPluginId: 'scaffolder',
        });

        const baseUrl = await discovery.getBaseUrl('scaffolder');
        let url = `${baseUrl}/v2/tasks/${input.taskId}/eventstream`;
        if (input.after !== undefined) {
          url += `?after=${input.after}`;
        }

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(`API failed: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        const logs: any[] = [];
        
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              logs.push(data);
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }

        logger.info(`Retrieved ${logs.length} log entries for task ${input.taskId}`);
        return { output: { logs, taskId: input.taskId } };
      } catch (error) {
        const errorMsg = `Failed to get logs: ${error instanceof Error ? error.message : String(error)}`;
        logger.error(errorMsg);
        return { output: { taskId: input.taskId, logs: [], isError: true, error: errorMsg } };
      }
    },
  });
}

