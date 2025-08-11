import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';
import { catalogServiceRef } from '@backstage/plugin-catalog-node/alpha';
import { drupalService } from './services/drupal';

/**
 * gdprPlugin backend plugin
 *
 * @public
 */
export const gdprPlugin = createBackendPlugin({
  pluginId: 'gdpr',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        auth: coreServices.auth,
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
        catalog: catalogServiceRef,
      },
      async init({ logger, config, auth, httpAuth, httpRouter}) {
     
        const todoListService = await drupalService({
          logger,
          auth,
          config
        });

        httpRouter.use(
          await createRouter({
            logger,
            config,
            httpAuth,
            drupalService: todoListService,
          }),
        );
        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });
      },
    });
  },
});
