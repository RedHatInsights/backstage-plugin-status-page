import { AuthService, DiscoveryService } from '@backstage/backend-plugin-api';
import { ActionsRegistryService } from '@backstage/backend-plugin-api/alpha';

/**
 * Registers the MCP action to trigger a Scaffolder template
 */
export function createTriggerScaffolderTemplateAction({
  auth,
  discovery,
  actionsRegistry,
}: {
  auth: AuthService;
  discovery: DiscoveryService;
  actionsRegistry: ActionsRegistryService;
}) {
  actionsRegistry.register({
    name: 'trigger-scaffolder-template',
    title: 'Trigger Scaffolder Template',
    description:
      'Execute a scaffolder template with provided input values. Starts a new task to create a project based on the template. Returns the task ID for progress tracking.',
    schema: {
      input: (z) =>
        z.object({
          templateRef: z
            .string()
            .describe('REQUIRED: The entity reference of the template (e.g., "template:default/my-template")'),
          values: z
            .record(z.any())
            .describe('REQUIRED: Template input values as key-value pairs'),
        }),
      output: (z) =>
        z.object({
          taskId: z.string().optional(),
          taskUrl: z.string().optional(),
          status: z.string().optional(),
          isError: z.boolean().optional(),
          error: z.string().optional(),
        }),
    },
    async action({ input, logger }) {
      try {
        if (!input.templateRef || !input.values) {
          throw new Error('templateRef and values are required');
        }

        logger.info(`Triggering template: ${input.templateRef}`);
        
        const { token } = await auth.getPluginRequestToken({
          onBehalfOf: await auth.getOwnServiceCredentials(),
          targetPluginId: 'scaffolder',
        });

        const baseUrl = await discovery.getBaseUrl('scaffolder');
        const url = `${baseUrl}/v2/tasks`;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            templateRef: input.templateRef,
            values: input.values,
          }),
        });

        if (!response.ok) {
          throw new Error(`API failed: ${response.status} ${response.statusText}`);
        }

        const task = await response.json();

        logger.info(`Template triggered, task ID: ${task?.id}`);
        return {
          output: {
            taskId: task?.id,
            taskUrl: `${baseUrl}/create/${task?.id}`,
            status: task?.status,
          },
        };
      } catch (error) {
        const errorMsg = `Failed to trigger template: ${error instanceof Error ? error.message : String(error)}`;
        logger.error(errorMsg);
        return { output: { isError: true, error: errorMsg } };
      }
    },
  });
}

