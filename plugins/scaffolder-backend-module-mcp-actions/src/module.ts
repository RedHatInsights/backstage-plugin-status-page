import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { actionsRegistryServiceRef } from '@backstage/backend-plugin-api/alpha';
import { createListScaffolderActionsAction } from './actions/listScaffolderActionsAction';
import { createListScaffolderTemplatesAction } from './actions/listScaffolderTemplatesAction';
import { createTriggerScaffolderTemplateAction } from './actions/triggerScaffolderTemplateAction';
import { createGetScaffolderTaskAction } from './actions/getScaffolderTaskAction';
import { createListScaffolderTasksAction } from './actions/listScaffolderTasksAction';
import { createCancelScaffolderTaskAction } from './actions/cancelScaffolderTaskAction';
import { createGetScaffolderTaskLogsAction } from './actions/getScaffolderTaskLogsAction';

/**
 * Scaffolder MCP Actions Backend Module
 *
 * Provides MCP actions for AI agents to interact with Backstage Scaffolder:
 * - list-scaffolder-actions: List all installed scaffolder actions
 * - get-scaffolder-templates: List all available templates
 * - trigger-scaffolder-template: Execute a template with input values
 * - get-scaffolder-task: Get status and details of a task
 * - list-scaffolder-tasks: List recent scaffolder tasks
 * - cancel-scaffolder-task: Cancel a running task
 * - get-scaffolder-task-logs: Retrieve execution logs for a task
 *
 * @public
 */
export const scaffolderMcpActionsModule = createBackendModule({
  pluginId: 'scaffolder',
  moduleId: 'mcp-actions',
  register(reg) {
    reg.registerInit({
      deps: {
        logger: coreServices.logger,
        auth: coreServices.auth,
        discovery: coreServices.discovery,
        actionsRegistry: actionsRegistryServiceRef,
      },
      async init({ logger, auth, discovery, actionsRegistry }) {
        logger.info('Initializing Scaffolder MCP Actions module');

        // Register all scaffolder MCP actions
        createListScaffolderActionsAction({
          auth,
          discovery,
          actionsRegistry,
        });

        createListScaffolderTemplatesAction({
          auth,
          discovery,
          actionsRegistry,
        });

        createTriggerScaffolderTemplateAction({
          auth,
          discovery,
          actionsRegistry,
        });

        createGetScaffolderTaskAction({
          auth,
          discovery,
          actionsRegistry,
        });

        createListScaffolderTasksAction({
          auth,
          discovery,
          actionsRegistry,
        });

        createCancelScaffolderTaskAction({
          auth,
          discovery,
          actionsRegistry,
        });

        createGetScaffolderTaskLogsAction({
          auth,
          discovery,
          actionsRegistry,
        });

        logger.info('Scaffolder MCP Actions registered successfully');
      },
    });
  },
});
