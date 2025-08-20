import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';

/**
 * auditCompliancePlugin backend plugin
 *
 * @public
 */
export const auditCompliancePlugin = createBackendPlugin({
  pluginId: 'audit-compliance',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        database: coreServices.database,
        httpRouter: coreServices.httpRouter,
        config: coreServices.rootConfig,
        permissions: coreServices.permissions,
        httpAuth: coreServices.httpAuth,
      },
      async init({ logger, database, httpRouter, config, permissions, httpAuth }) {
        logger.info('[audit-compliance] Plugin initialization started');
        try {
          httpRouter.addAuthPolicy({
            allow: 'unauthenticated',
             path: '/health',
          });
          const router = await createRouter(database, config, logger, permissions, httpAuth);
          httpRouter.use(router);
        } catch (err) {
          logger.error(`Failed to initialize audit-compliance plugin: ${err}`);
        }
      },
    });
  },
});
