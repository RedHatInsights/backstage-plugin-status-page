import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import {
  catalogLocationsExtensionPoint,
  catalogProcessingExtensionPoint,
} from '@backstage/plugin-catalog-node/alpha';
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
        locationProcessor: catalogLocationsExtensionPoint,
      },
      async init({
        discoveryApi,
        auth,
        logger,
        catalogProcessor,
        locationProcessor,
      }) {
        logger.info('Datasource entity processor module is loaded');

        const datasourceClient = new DatasourceApiClient({ discoveryApi });

        locationProcessor.setAllowedLocationTypes(['datasource']);
        catalogProcessor.addProcessor(
          new DatasourceEntityProcessor(logger, datasourceClient, auth),
        );
      },
    });
  },
});
