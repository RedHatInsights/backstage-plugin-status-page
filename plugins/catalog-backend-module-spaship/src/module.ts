import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { SPAshipDiscoveryEntityProvider } from './SPAshipDiscoveryEntityProvider';

export const catalogModuleSpaship = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'spaship',
  register(reg) {
    reg.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
        config: coreServices.rootConfig,
        logger: coreServices.logger,
        scheduler: coreServices.scheduler,
      },
      async init({ catalog, config, logger, scheduler }) {
        catalog.addEntityProvider(
          SPAshipDiscoveryEntityProvider.fromConfig(config, {
            logger,
            scheduler,
          }),
        );
      },
    });
  },
});
