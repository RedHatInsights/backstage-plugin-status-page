import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';
import {
  IncidentFetchService,
  PostmortemFetchService,
  TemplateFetchService,
} from './services';
import { createGetOutageDetailsAction } from './actions/getOutageDetailsAction';
import { actionsRegistryServiceRef } from '@backstage/backend-plugin-api/alpha';
import { createGetOutagesAction } from './actions/getOutagesAction';

/**
 * outageTemplate backend plugin
 *
 * @public
 */
export const outageTemplatePlugin = createBackendPlugin({
  pluginId: 'outage-template-backend',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
        catalog: catalogServiceRef,
        config: coreServices.rootConfig,
        databaseServer: coreServices.database,
        cache: coreServices.cache,
        actionsRegistry: actionsRegistryServiceRef,
        auth: coreServices.auth,
      },
      async init({ logger, httpAuth, httpRouter, config, databaseServer, cache, actionsRegistry, auth }) {
        try {
          const statusPageUrl =
            config.getOptionalString('outageService.statusPageUrl') || '';
          const statusPageAuthToken =
            config.getOptionalString('outageService.statusPageAuthToken') || '';

          const incidentFetchService = await IncidentFetchService({
            logger,
            statusPageUrl,
            statusPageAuthToken,
            cache,
          });
          const postmortemFetchService = await PostmortemFetchService({
            logger,
            statusPageUrl,
            statusPageAuthToken,
          });
          const templateFetchService = await TemplateFetchService({
            logger,
          });

          // Register MCP actions
          createGetOutagesAction({
            actionsRegistry,
            cache,
            auth,
            logger,
          });
          
          createGetOutageDetailsAction({
            actionsRegistry,
            cache,
            auth,
            logger,
          });

          httpRouter.addAuthPolicy({
            allow: 'unauthenticated',
            path: '/health',
          });
          httpRouter.use(
            await createRouter({
              httpAuth,
              incidentFetchService,
              postmortemFetchService,
              templateFetchService,
              logger,
              databaseServer,
              actionsRegistry: actionsRegistryServiceRef,
            }),
          );
        } catch (err) {
          logger.error(String(err));
        }
      },
    });
  },
});
