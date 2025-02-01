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
        config: coreServices.rootConfig,
        logger: coreServices.logger,
      },
      async init({ factCollection, config, logger }) {
        factCollection.addFactCollector(RedHatGitLabFactCollector.create(
          config,
          logger,
        ));
      },
    });
  },
});
