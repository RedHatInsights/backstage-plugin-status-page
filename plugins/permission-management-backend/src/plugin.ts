import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { catalogServiceRef } from '@backstage/plugin-catalog-node/alpha';
import { createRouter } from './routes/createRouter';

/**
 * permissionManagementPlugin backend plugin
 *
 * @public
 */
export const permissionManagementPlugin = createBackendPlugin({
  pluginId: 'permission-management',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        database: coreServices.database,
        auth: coreServices.auth,
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
        catalog: catalogServiceRef,
        discovery: coreServices.discovery,
        permissions: coreServices.permissions,
      },
      async init({
        logger,
        config,
        database,
        auth,
        httpAuth,
        httpRouter,
        catalog: _catalog,
        discovery,
        permissions,
      }) {
        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });

        httpRouter.use(
          await createRouter({
            logger,
            config,
            database,
            auth,
            httpAuth,
            discovery,
            permissions,
          }),
        );
      },
    });
  },
});
