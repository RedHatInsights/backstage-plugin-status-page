import {
  coreServices,
  createBackendPlugin,
  resolvePackagePath,
} from '@backstage/backend-plugin-api';
import { signalsServiceRef } from '@backstage/plugin-signals-node';
import { createRouter } from './router';
import { ChatThreads } from './models/ChatThreads';
import pkg from '../package.json';

const migrationsDir = resolvePackagePath(
  pkg.name,
  'migrations',
);

/**
 * assistantPlugin backend plugin
 *
 * @public
 */
export const assistantPlugin = createBackendPlugin({
  pluginId: 'assistant',
  register(env) {
    env.registerInit({
      deps: {
        auth: coreServices.auth,
        rootConfig: coreServices.rootConfig,
        database: coreServices.database,
        discoveryApi: coreServices.discovery,
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
        scheduler: coreServices.scheduler,
        signals: signalsServiceRef,
      },
      async init({
        auth,
        rootConfig,
        database,
        discoveryApi,
        httpAuth,
        httpRouter,
        logger,
        scheduler,
        signals,
      }) {
        const dbClient = await database.getClient();
        await dbClient.migrate.latest({
          directory: migrationsDir,
        });

        const model = new ChatThreads(dbClient);

        const taskRunner = scheduler.createScheduledTaskRunner({
          frequency: {
            trigger: 'manual',
          },
          timeout: {
            minutes: 5,
          },
          scope: 'global',
        });

        httpRouter.use(
          await createRouter({
            auth,
            rootConfig,
            discoveryApi,
            httpAuth,
            logger,
            model,
            taskRunner,
            scheduler,
            signals,
          }),
        );

        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated'
        });
      },
    });
  },
});
