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
      },
      async init({ logger, database, httpRouter, config }) {
        logger.info('[audit-compliance] Plugin initialization started');
        try {
          const router = await createRouter(database, config, logger);
          httpRouter.use(router);
        } catch (err) {
          logger.error(`Failed to initialize audit-compliance plugin: ${err}`);
        }
      },
    });
  },
});
