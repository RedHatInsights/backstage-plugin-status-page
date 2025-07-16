import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';
import { IncidentFetchService } from './services';

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
      },
      async init({ logger, httpAuth, httpRouter, config }) {
        try {
          const statusPageUrl =
            config.getOptionalString('outageService.statusPageUrl') || '';
          const statusPageAuthToken =
            config.getOptionalString('outageService.statusPageAuthToken') || '';

          const incidentFetchService = await IncidentFetchService({
            logger,
            statusPageUrl,
            statusPageAuthToken,
          });

          httpRouter.use(
            await createRouter({
              httpAuth,
              incidentFetchService,
            }),
          );
        } catch (err) {
          logger.error(String(err));
        }
      },
    });
  },
});
