import { WorkstreamUrlReader } from '@appdev-platform/backstage-plugin-workstream-automation-backend';
import { UrlReaders } from '@backstage/backend-defaults/urlReader';
import {
  coreServices,
  createServiceFactory,
} from '@backstage/backend-plugin-api';

export const urlReaderServiceFactory = createServiceFactory({
  service: coreServices.urlReader,
  deps: {
    config: coreServices.rootConfig,
    logger: coreServices.logger,
    auth: coreServices.auth,
    discovery: coreServices.discovery
  },
  async factory(deps) {
    return UrlReaders.default({
      config: deps.config,
      logger: deps.logger,
      factories: [await WorkstreamUrlReader.getFactory(deps.auth, deps.discovery)],
    });
  },
});
