
import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { actionsRegistryServiceRef } from '@backstage/backend-plugin-api/alpha';
import { CatalogClient } from '@backstage/catalog-client';
import { createRouter } from './router';
import { createListEntitiesWithFiltersAction } from './actions/listEntitiesWithFiltersAction';
import { createGetWorkstreamPortfolioAction } from './actions/getWorkstreamPortfolioAction';

/**
 * compassAssistantExamplePlugin backend plugin
 *
 * @public
 */
export const compassAssistantExamplePlugin = createBackendPlugin({
  pluginId: 'mcp-actions-example',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        discovery: coreServices.discovery,
        httpRouter: coreServices.httpRouter,
        auth: coreServices.auth,
        actionsRegistry: actionsRegistryServiceRef,
      },
      async init({
        logger,
        discovery,
        httpRouter,
        auth,
        actionsRegistry,
      }) {
        const catalogClient = new CatalogClient({ discoveryApi: discovery });

        // Register MCP actions
        createListEntitiesWithFiltersAction({
          catalog: catalogClient,
          auth,
          actionsRegistry,
        });
        createGetWorkstreamPortfolioAction({
          catalog: catalogClient,
          auth,
          actionsRegistry,
        });

        logger.info('MCP actions registered successfully');

        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });

        const router = await createRouter({
          logger,
        });

        httpRouter.use(router);
      },
    });
  },
});

