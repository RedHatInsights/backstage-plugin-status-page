'use strict';

import {
  factCollectionExtensionPoint,
} from '@spotify/backstage-plugin-soundcheck-node';
import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import {
  RedHatServiceNowFactCollector
} from "./FactCollector/RedHatServiceNowFactCollector";

export const soundcheckModuleRedHatServiceNow = createBackendModule({
  pluginId: 'soundcheck',
  moduleId: 'red-hat-service-now',
  register(reg) {
    reg.registerInit({
      deps: {
        factCollection: factCollectionExtensionPoint,
        cache: coreServices.cache,
        config: coreServices.rootConfig,
        logger: coreServices.logger,
      },
      async init({ factCollection, cache, config, logger }) {
        factCollection.addFactCollector(RedHatServiceNowFactCollector.create(
          cache,
          config,
          logger,
        ));
      },
    });
  },
});
