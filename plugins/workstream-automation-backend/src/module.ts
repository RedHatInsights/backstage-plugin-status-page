import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { WorkstreamEntityProcessor } from './modules';
import { WorkstreamBackendClient } from './modules/lib/client';

const workstreamCatalogModule = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'workstream',
  register(reg) {
    reg.registerInit({
      deps: {
        auth: coreServices.auth,
        catalog: catalogProcessingExtensionPoint,
        discovery: coreServices.discovery,
        logger: coreServices.logger,
      },
      async init({ catalog, auth, logger, discovery }) {
        logger.info('Workstream backend module loaded');
        const workstreamClient = new WorkstreamBackendClient(discovery, auth);
        const catalogProcessor = new WorkstreamEntityProcessor({
          logger,
          workstreamClient,
        });
        catalog.addProcessor(catalogProcessor);
      },
    });
  },
});

export default workstreamCatalogModule;
