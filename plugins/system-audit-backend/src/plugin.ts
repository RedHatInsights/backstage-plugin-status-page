import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';

/**
 * systemAuditPlugin backend plugin
 *
 * @public
 */
export const systemAuditPlugin = createBackendPlugin({
  pluginId: 'system-audit',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        database: coreServices.database,
        httpRouter: coreServices.httpRouter,
        config: coreServices.rootConfig,
      },
      async init({ logger, database, httpRouter, config }) {
        logger.info('[system-audit] Plugin initialization started');
        try {
          httpRouter.addAuthPolicy({
            allow: 'unauthenticated',
            path: '/health',
          });
          const router = await createRouter(database, config, logger);
          httpRouter.use(router);
        } catch (err) {
          logger.error(`Failed to initialize system-audit plugin: ${err}`);
        }
      },
    });
  },
});

