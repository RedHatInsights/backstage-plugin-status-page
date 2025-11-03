import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createHealthRouter } from './services/healthRouter';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';
import { createRouter } from './services/router';

/**
 * datasourcePlugin backend plugin
 *
 * @public
 */
export const datasourcePlugin = createBackendPlugin({
  pluginId: 'datasource',
  register(env) {
    env.registerInit({
      deps: {
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
        database: coreServices.database,
        catalog: catalogServiceRef,
        auth: coreServices.auth,
      },
      async init({ httpAuth, httpRouter, database, catalog, auth }) {
        httpRouter.use(await createHealthRouter());
        httpRouter.use(
          await createRouter({ httpAuth, database, catalog, auth }),
        );
      },
    });
  },
});
