'use strict';

import { factCollectionExtensionPoint } from '@spotify/backstage-plugin-soundcheck-node';
import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { RedHatSmartsheetFactCollector } from './FactCollector/RedHatSmartsheetFactCollector';

export const soundcheckModuleRedHatSmartsheet = createBackendModule({
  pluginId: 'soundcheck',
  moduleId: 'red-hat-smartsheet',
  register(reg) {
    reg.registerInit({
      deps: {
        factCollection: factCollectionExtensionPoint,
        cache: coreServices.cache,
        config: coreServices.rootConfig,
        logger: coreServices.logger,
      },
      async init({ factCollection, cache, config, logger }) {
        try {
          factCollection.addFactCollector(
            RedHatSmartsheetFactCollector.create(cache, config, logger),
          );
        } catch (error: any) {
          logger.warn(error);
        }
      },
    });
  },
});
