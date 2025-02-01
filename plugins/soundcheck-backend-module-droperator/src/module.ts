'use strict';

import {
  factCollectionExtensionPoint,
} from '@spotify/backstage-plugin-soundcheck-node';
import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import {
  DroperatorFactCollector,
} from './FactCollector/DroperatorFactCollector';

export const soundcheckModuleDroperator = createBackendModule({
  pluginId: 'soundcheck',
  moduleId: 'droperator',
  register(reg) {
    reg.registerInit({
      deps: {
        factCollection: factCollectionExtensionPoint,
        cache: coreServices.cache,
        config: coreServices.rootConfig,
        logger: coreServices.logger,
      },
      async init({ factCollection, cache, config, logger }) {
        factCollection.addFactCollector(DroperatorFactCollector.create(
          cache,
          config,
          logger,
        ));
      },
    });
  },
});
