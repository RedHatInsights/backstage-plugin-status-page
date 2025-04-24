'use strict';

import {
  factCollectionExtensionPoint,
} from '@spotify/backstage-plugin-soundcheck-node';
import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import {
  RedHatGitLabFactCollector
} from "./FactCollector/RedHatGitLabFactCollector";

export const soundcheckModuleRedHatGitlab = createBackendModule({
  pluginId: 'soundcheck',
  moduleId: 'red-hat-gitlab',
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
          factCollection.addFactCollector(RedHatGitLabFactCollector.create(
            cache,
            config,
            logger,
          ));
        }
        catch (error: any) {
          logger.warn(error);
        }
      },
    });
  },
});
