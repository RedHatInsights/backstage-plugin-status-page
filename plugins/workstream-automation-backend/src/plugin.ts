import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';
import { workstreamPluginPermissions } from '@compass/backstage-plugin-workstream-automation-common';
import { createRouter } from './service/router';

/**
 * Workstream Automation Backend plugin
 *
 * @public
 */
export const workstreamAutomationPlugin = createBackendPlugin({
  pluginId: 'workstream',
  register(env) {
    env.registerInit({
      deps: {
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        auth: coreServices.auth,
        database: coreServices.database,
        discovery: coreServices.discovery,
        permissions: coreServices.permissions,
        httpAuth: coreServices.httpAuth,
        permissionsRegistry: coreServices.permissionsRegistry,
        catalog: catalogServiceRef,
      },
      async init({
        httpRouter,
        logger,
        config,
        auth,
        database,
        discovery,
        permissions,
        httpAuth,
        catalog,
        permissionsRegistry,
      }) {
        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });
        permissionsRegistry.addPermissions(workstreamPluginPermissions);
        httpRouter.use(
          await createRouter({
            logger,
            config,
            auth,
            database,
            discovery,
            permissions,
            httpAuth,
            catalog,
            permissionsRegistry,
          }),
        );
      },
    });
  },
});
