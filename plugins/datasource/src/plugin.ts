import {
  createApiFactory,
  createPlugin,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';

import { DatasourceApiClient } from '@compass/backstage-plugin-datasource-common';
import { datasourceApiRef } from './api';
import { rootRouteRef } from './routes';

export const datasourcePlugin = createPlugin({
  id: 'datasource',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: datasourceApiRef,
      deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
      factory: ({ discoveryApi, fetchApi }) => {
        return new DatasourceApiClient({ discoveryApi, fetchApi });
      },
    }),
  ],
});
