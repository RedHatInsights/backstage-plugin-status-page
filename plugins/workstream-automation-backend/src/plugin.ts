import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
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
      },
      async init({ httpRouter, logger, config, auth, database, discovery }) {
        const isEnabled =
          config.getOptionalBoolean('workstream.enabled') ?? false;
        if (!isEnabled) {
          logger.warn(
            'Workstream backend plugin is disabled. Enable it by setting workstreams.enabled=true.',
          );
          return;
        }
        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });
        httpRouter.use(
          await createRouter({
            logger,
            config,
            auth,
            database,
            discovery,
          }),
        );
      },
    });
  },
});
