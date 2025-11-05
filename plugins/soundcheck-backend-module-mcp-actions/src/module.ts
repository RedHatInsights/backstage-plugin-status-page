import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { actionsRegistryServiceRef } from '@backstage/backend-plugin-api/alpha';
import { createListSoundcheckAction } from './actions/listSoundcheckAction';
import { createGetSoundcheckResultsAction } from './actions/getSoundcheckResultsAction';
import { createGetSoundcheckAggregationsAction } from './actions/getSoundcheckAggregationsAction';

/**
 * Soundcheck MCP Actions Backend Module
 * 
 * Provides MCP actions for interacting with Soundcheck:
 * - list-soundcheck-info: List checks and tracks
 * - get-soundcheck-results: Get check results for an entity
 * - get-soundcheck-aggregations: Get aggregated statistics and pass rates
 * 
 * @public
 */
export const soundcheckModuleMcpActions = createBackendModule({
  pluginId: 'soundcheck',
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
        logger.info('Initializing Soundcheck MCP Actions module');

        // Register Soundcheck MCP actions
        createListSoundcheckAction({
          auth,
          discovery,
          actionsRegistry,
        });

        createGetSoundcheckResultsAction({
          auth,
          discovery,
          actionsRegistry,
        });

        createGetSoundcheckAggregationsAction({
          auth,
          discovery,
          actionsRegistry,
        });

        logger.info('Soundcheck MCP Actions registered successfully');
      },
    });
  },
});
