import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { DatasourceApiClient } from '@compass/backstage-plugin-datasource-common';
import { DatasourceEntityProcessor } from './DatasourceEntityProcessor';

export const catalogModuleDatasource = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'datasource',
  register(reg) {
    reg.registerInit({
      deps: {
        discoveryApi: coreServices.discovery,
        auth: coreServices.auth,
        logger: coreServices.logger,
        catalogProcessor: catalogProcessingExtensionPoint,
      },
      async init({ discoveryApi, auth, logger, catalogProcessor }) {
        logger.info('Datasource entity processor module is loaded');

        const datasourceClient = new DatasourceApiClient({ discoveryApi });

        catalogProcessor.addProcessor(
          new DatasourceEntityProcessor(logger, datasourceClient, auth),
        );
      },
    });
  },
});
