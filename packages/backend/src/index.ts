import { authServiceFactory } from '@backstage/backend-defaults/auth';
import { cacheServiceFactory } from '@backstage/backend-defaults/cache';
import { databaseServiceFactory } from '@backstage/backend-defaults/database';
import { discoveryServiceFactory } from '@backstage/backend-defaults/discovery';
import { httpAuthServiceFactory } from '@backstage/backend-defaults/httpAuth';
import { httpRouterServiceFactory } from '@backstage/backend-defaults/httpRouter';
import { lifecycleServiceFactory } from '@backstage/backend-defaults/lifecycle';
import { loggerServiceFactory } from '@backstage/backend-defaults/logger';
import { permissionsServiceFactory } from '@backstage/backend-defaults/permissions';
import { rootConfigServiceFactory } from '@backstage/backend-defaults/rootConfig';
import { rootHttpRouterServiceFactory } from '@backstage/backend-defaults/rootHttpRouter';
import { rootLifecycleServiceFactory } from '@backstage/backend-defaults/rootLifecycle';
import { rootLoggerServiceFactory } from '@backstage/backend-defaults/rootLogger';
import { schedulerServiceFactory } from '@backstage/backend-defaults/scheduler';
import { userInfoServiceFactory } from '@backstage/backend-defaults/userInfo';
import { eventsServiceFactory } from '@backstage/plugin-events-node';

import {
  identityServiceFactory,
  tokenManagerServiceFactory,
  createSpecializedBackend,
} from '@backstage/backend-app-api';

import { ServiceFactory } from '@backstage/backend-plugin-api';

import { urlReaderServiceFactory } from './service/urlReader';

const defaultServiceFactories: Array<
  ServiceFactory<unknown, 'plugin' | 'root'>
> = [
  authServiceFactory(),
  cacheServiceFactory(),
  rootConfigServiceFactory(),
  databaseServiceFactory(),
  discoveryServiceFactory(),
  httpAuthServiceFactory(),
  httpRouterServiceFactory(),
  identityServiceFactory(),
  lifecycleServiceFactory(),
  loggerServiceFactory(),
  permissionsServiceFactory(),
  rootHttpRouterServiceFactory(),
  rootLifecycleServiceFactory(),
  rootLoggerServiceFactory(),
  schedulerServiceFactory(),
  tokenManagerServiceFactory(),
  userInfoServiceFactory(),
  eventsServiceFactory(),
  // Custom url reader
  urlReaderServiceFactory(),
];

const backend = createSpecializedBackend({ defaultServiceFactories });

backend.add(import('@backstage/plugin-app-backend/alpha'));
backend.add(import('@backstage/plugin-proxy-backend/alpha'));
backend.add(import('@backstage/plugin-scaffolder-backend/alpha'));
backend.add(import('@backstage/plugin-techdocs-backend/alpha'));

// auth plugin
backend.add(import('@backstage/plugin-auth-backend'));
// See https://backstage.io/docs/backend-system/building-backends/migrating#the-auth-plugin
backend.add(import('@backstage/plugin-auth-backend-module-guest-provider'));
// See https://backstage.io/docs/auth/guest/provider

// Initialize plugin before catalog module
backend.add(
  import('@appdev-platform/backstage-plugin-workstream-automation-backend'),
);
// catalog plugin
backend.add(import('@backstage/plugin-catalog-backend/alpha'));
backend.add(
  import('@backstage/plugin-catalog-backend-module-scaffolder-entity-model'),
);
backend.add(import('@backstage/plugin-catalog-backend-module-unprocessed'));
backend.add(
  import(
    '@appdev-platform/backstage-plugin-workstream-automation-backend/module'
  ),
);
backend.add(
  import('@appdev-platform/backstage-plugin-catalog-backend-module-cmdb'),
);
backend.add(
  import(
    '@appdev-platform/backstage-plugin-catalog-backend-module-spaship/alpha'
  ),
);
backend.add(
  import('@appdev-platform/backstage-plugin-catalog-backend-module-enrichment'),
);

// permission plugin
backend.add(import('@backstage/plugin-permission-backend/alpha'));
backend.add(import('./policy'));

// search plugin
backend.add(import('@backstage/plugin-search-backend/alpha'));
backend.add(import('@backstage/plugin-search-backend-module-catalog/alpha'));
backend.add(import('@backstage/plugin-search-backend-module-techdocs/alpha'));

backend.add(import('@janus-idp/backstage-plugin-matomo-backend/alpha'));
backend.add(import('@janus-idp/backstage-plugin-feedback-backend/alpha'));
backend.add(import('@backstage-community/plugin-report-portal-backend'));

backend.start();
