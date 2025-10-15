import {
  coreServices,
  createBackendModule
} from '@backstage/backend-plugin-api';
import {
  catalogProcessingExtensionPoint
} from '@backstage/plugin-catalog-node/alpha';
import { DatasourceEntityProcessor } from './DatasourceEntityProcessor';

export const catalogModuleDatasource = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'datasource',
  register(reg) {
    reg.registerInit({
      deps: {
        logger: coreServices.logger,
        catalogProcessor: catalogProcessingExtensionPoint,
      },
      async init({ logger, catalogProcessor }) {
        logger.info('Datasource entity processor module is loaded');
        catalogProcessor.addProcessor(new DatasourceEntityProcessor(logger));
      },
    });
  },
});
