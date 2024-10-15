import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { CMDBDiscoveryEntityProvider } from './CMDBDiscoveryEntityProvider';
import { CatalogClient } from '@backstage/catalog-client';
import { BusinessApplicationEntityProcessor } from './CMDBDiscoveryEntityProcessor';

export const catalogModuleCmdb = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'cmdb',
  register(reg) {
    reg.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
        config: coreServices.rootConfig,
        discovery: coreServices.discovery,
        auth: coreServices.auth,
        logger: coreServices.logger,
        scheduler: coreServices.scheduler,
      },
      async init({
        catalog,
        config,
        discovery,
        auth,
        logger,
        scheduler,
      }) {
        catalog.addEntityProvider(
          CMDBDiscoveryEntityProvider.fromConfig(config, {
            logger,
            scheduler,
          }),
        );

        const catalogApi = new CatalogClient({
          discoveryApi: discovery,
        });

        const cmdbProcessor = new BusinessApplicationEntityProcessor({
          catalogApi,
          auth,
          logger: logger,
        });

        catalog.addProcessor(cmdbProcessor);
      },
    });
  },
});
