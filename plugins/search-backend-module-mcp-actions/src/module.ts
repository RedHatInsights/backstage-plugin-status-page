import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { actionsRegistryServiceRef } from '@backstage/backend-plugin-api/alpha';
import { createSearchCatalogAction } from './actions/searchCatalogAction';

/**
 * Search MCP Actions Backend Module
 * 
 * Provides MCP action for interacting with Backstage Search:
 * - search-catalog: Full-text search across entities and documentation
 * 
 * @public
 */
export const searchModuleMcpActions = createBackendModule({
  pluginId: 'search',
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
        logger.info('Initializing Search MCP Actions module');

        // Register Search MCP action
        createSearchCatalogAction({
          auth,
          discovery,
          actionsRegistry,
        });

        logger.info('Search MCP Actions registered successfully');
      },
    });
  },
});
