# workstream-automation

Welcome to the workstream-automation backend plugin!

## Getting started

The backend plugin provides api to store workstream data directly in backstage, the plugin also provides a cusotm catalog processor to import data directly in catalog

- Install the backend plugin by running following command.

```sh
yarn workspace backend add @compass/backstage-plugin-workstream-automation-backend
```

- Add the following configuration in your `app-config.yaml`.

```yaml
backend:
  auth:
    externalAccess:
      - type: static
        options:
          token: ${WORKSTREAM_FETCH_TOKEN}
          subject: shared-workstream-catalog-token
        accessRestrictions:
          - plugin: workstream
          - plugin: catalog

integrations:
  workstream:
    - host: localhost:7007
      apiBaseUrl: http://localhost:7007/api/workstream
      token: Bearer ${WORKSTREAM_ACCESS_TOKEN}
```

- Now in the backend folder of backstage, create this file `packages/backend/src/service/urlReader/urlReaderServiceFactory.ts` and add following content.

```ts
import { WorkstreamUrlReader } from '@compass/backstage-plugin-workstream-automation-backend';
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
  },
  async factory(deps) {
    return UrlReaders.default({
      config: deps.config,
      logger: deps.logger,
      // this factory will allow to import entities from http://localhost address
      factories: [WorkstreamUrlReader.factory],
    });
  },
});
```

- Now create a specialized backend with our custom url reader. Also add catalog processor and add backend plugin, open `packages/backend/src/index.ts`.

```diff
- import { createBackend } from '@backstage/backend-defaults';
+ import { authServiceFactory } from '@backstage/backend-defaults/auth';
+ import { cacheServiceFactory } from '@backstage/backend-defaults/cache';
+ import { databaseServiceFactory } from '@backstage/backend-defaults/database';
+ import { discoveryServiceFactory } from '@backstage/backend-defaults/discovery';
+ import { httpAuthServiceFactory } from '@backstage/backend-defaults/httpAuth';
+ import { httpRouterServiceFactory } from '@backstage/backend-defaults/httpRouter';
+ import { lifecycleServiceFactory } from '@backstage/backend-defaults/lifecycle';
+ import { loggerServiceFactory } from '@backstage/backend-defaults/logger';
+ import { permissionsServiceFactory } from '@backstage/backend-defaults/permissions';
+ import { rootConfigServiceFactory } from '@backstage/backend-defaults/rootConfig';
+ import { rootHttpRouterServiceFactory } from '@backstage/backend-defaults/rootHttpRouter';
+ import { rootLifecycleServiceFactory } from '@backstage/backend-defaults/rootLifecycle';
+ import { rootLoggerServiceFactory } from '@backstage/backend-defaults/rootLogger';
+ import { schedulerServiceFactory } from '@backstage/backend-defaults/scheduler';
+ import { userInfoServiceFactory } from '@backstage/backend-defaults/userInfo';
+ import { eventsServiceFactory } from '@backstage/plugin-events-node';
+
+ import {
+   identityServiceFactory,
+   tokenManagerServiceFactory,
+ } from '@backstage/backend-app-api';
+
+ import { workstreamCatalogModule } from '@compass/backstage-plugin-workstream-automation-backend';
+ import { createSpecializedBackend } from '@backstage/backend-app-api';
+ import { ServiceFactory } from '@backstage/backend-plugin-api';
+
+ import { urlReaderServiceFactory } from './service/urlReader';
+
+ const defaultServiceFactories: Array<
+   ServiceFactory<unknown, 'plugin' | 'root'>
+ > = [
+   authServiceFactory(),
+   cacheServiceFactory(),
+   rootConfigServiceFactory(),
+   databaseServiceFactory(),
+   discoveryServiceFactory(),
+   httpAuthServiceFactory(),
+   httpRouterServiceFactory(),
+   identityServiceFactory(),
+   lifecycleServiceFactory(),
+   loggerServiceFactory(),
+   permissionsServiceFactory(),
+   rootHttpRouterServiceFactory(),
+   rootLifecycleServiceFactory(),
+   rootLoggerServiceFactory(),
+   schedulerServiceFactory(),
+   tokenManagerServiceFactory(),
+   userInfoServiceFactory(),
+   eventsServiceFactory(),
+   // Custom url reader
+   urlReaderServiceFactory(),
+ ];

- const backend = createBackend()
+ const backend = createSpecializedBackend({ defaultServiceFactories });

backend.add(import('@backstage/plugin-app-backend/alpha'));
backend.add(import('@backstage/plugin-proxy-backend/alpha'));

// auth plugin
backend.add(import('@backstage/plugin-auth-backend'));
backend.add(import('@backstage/plugin-auth-backend-module-guest-provider'));

+ // workstream-automation-plugin
+ backend.add(import('@compass/backstage-plugin-workstream-automation-backend'));

// catalog plugin
backend.add(import('@backstage/plugin-catalog-backend/alpha'));

+ // Add catalog processor
+ backend.add(workstreamCatalogModule);
```
