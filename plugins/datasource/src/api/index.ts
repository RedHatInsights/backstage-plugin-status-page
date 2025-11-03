import { createApiRef } from '@backstage/core-plugin-api';
import { DatasourceApiClient } from '@compass/backstage-plugin-datasource-common';

export const datasourceApiRef = createApiRef<DatasourceApiClient>({
  id: 'plugin.datasource',
});
