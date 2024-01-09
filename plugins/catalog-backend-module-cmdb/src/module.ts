import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { CMDBDiscoveryEntityProvider } from './CMDBDiscoveryEntityProvider';
import { loggerToWinstonLogger } from '@backstage/backend-common';

export const catalogModuleCmdb = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'cmdb',
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
          CMDBDiscoveryEntityProvider.fromConfig(config, {
            logger: loggerToWinstonLogger(logger),
            scheduler,
          }),
        );
      },
    });
  },
});
