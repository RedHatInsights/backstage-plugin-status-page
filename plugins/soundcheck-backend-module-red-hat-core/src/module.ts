import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import {
  factCollectionExtensionPoint,
} from '@spotify/backstage-plugin-soundcheck-node';
import {
  RedHatCoreFactCollector,
} from './FactCollector/RedHatCoreFactCollector';

export const soundcheckModuleRedHatCore = createBackendModule({
  pluginId: 'soundcheck',
  moduleId: 'red-hat-core',
  register(reg) {
    reg.registerInit({
      deps: {
        factCollection: factCollectionExtensionPoint,
        cache: coreServices.cache,
        config: coreServices.rootConfig,
        logger: coreServices.logger,
      },
      async init({ factCollection, cache, config, logger }) {
        factCollection.addFactCollector(
          RedHatCoreFactCollector.create(cache, config, logger),
        );
      },
    });
  },
});
