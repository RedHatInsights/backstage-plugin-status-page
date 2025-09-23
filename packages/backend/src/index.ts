import {
  actionsRegistryServiceFactory,
  actionsServiceFactory,
} from '@backstage/backend-defaults/alpha';
import { auditorServiceFactory } from '@backstage/backend-defaults/auditor';
import { authServiceFactory } from '@backstage/backend-defaults/auth';
import { cacheServiceFactory } from '@backstage/backend-defaults/cache';
import { databaseServiceFactory } from '@backstage/backend-defaults/database';
import { discoveryServiceFactory } from '@backstage/backend-defaults/discovery';
import { httpAuthServiceFactory } from '@backstage/backend-defaults/httpAuth';
import { httpRouterServiceFactory } from '@backstage/backend-defaults/httpRouter';
import { lifecycleServiceFactory } from '@backstage/backend-defaults/lifecycle';
import { loggerServiceFactory } from '@backstage/backend-defaults/logger';
import { permissionsServiceFactory } from '@backstage/backend-defaults/permissions';
import { permissionsRegistryServiceFactory } from '@backstage/backend-defaults/permissionsRegistry';
import { rootConfigServiceFactory } from '@backstage/backend-defaults/rootConfig';
import { rootHealthServiceFactory } from '@backstage/backend-defaults/rootHealth';
import { rootHttpRouterServiceFactory } from '@backstage/backend-defaults/rootHttpRouter';
import { rootLifecycleServiceFactory } from '@backstage/backend-defaults/rootLifecycle';
import { rootLoggerServiceFactory } from '@backstage/backend-defaults/rootLogger';
import { schedulerServiceFactory } from '@backstage/backend-defaults/scheduler';
import { userInfoServiceFactory } from '@backstage/backend-defaults/userInfo';

import { eventsServiceFactory } from '@backstage/plugin-events-node';

import { createSpecializedBackend } from '@backstage/backend-app-api';

import { ServiceFactory } from '@backstage/backend-plugin-api';

import { urlReaderServiceFactory } from './service/urlReader';

const defaultServiceFactories: Array<
  ServiceFactory<unknown, 'plugin' | 'root'>
> = [
  actionsRegistryServiceFactory,
  actionsServiceFactory,
  auditorServiceFactory,
  authServiceFactory,
  cacheServiceFactory,
  databaseServiceFactory,
  discoveryServiceFactory,
  eventsServiceFactory,
  httpAuthServiceFactory,
  httpRouterServiceFactory,
  lifecycleServiceFactory,
  loggerServiceFactory,
  permissionsRegistryServiceFactory,
  permissionsServiceFactory,
  rootConfigServiceFactory,
  rootHealthServiceFactory,
  rootHttpRouterServiceFactory,
  rootLifecycleServiceFactory,
  rootLoggerServiceFactory,
  schedulerServiceFactory,
  userInfoServiceFactory,
  // Custom url reader
  urlReaderServiceFactory,
  ];

const backend = createSpecializedBackend({ defaultServiceFactories });

backend.add(import('@backstage/plugin-app-backend'));
backend.add(import('@backstage/plugin-proxy-backend'));
backend.add(import('@backstage/plugin-scaffolder-backend'));
backend.add(import('@backstage/plugin-techdocs-backend/alpha'));

// auth plugin
backend.add(import('@backstage/plugin-auth-backend'));
// See https://backstage.io/docs/backend-system/building-backends/migrating#the-auth-plugin
backend.add(import('@backstage/plugin-auth-backend-module-guest-provider'));
// See https://backstage.io/docs/auth/guest/provider

backend.add(import('@backstage/plugin-auth-backend-module-oauth2-provider'));

// Initialize plugin before catalog module
backend.add(
  import('@compass/backstage-plugin-workstream-automation-backend'),
);
// catalog plugin
backend.add(import('@backstage/plugin-catalog-backend'));
backend.add(
  import('@backstage/plugin-catalog-backend-module-scaffolder-entity-model'),
);
backend.add(import('@backstage/plugin-catalog-backend-module-unprocessed'));
backend.add(
  import(
    '@compass/backstage-plugin-workstream-automation-backend/module'
  ),
);
backend.add(
  import('@compass/backstage-plugin-catalog-backend-module-cmdb'),
);
backend.add(
  import(
    '@compass/backstage-plugin-catalog-backend-module-spaship/alpha'
  ),
);
backend.add(
  import('@compass/backstage-plugin-catalog-backend-module-enrichment'),
);

// permission plugin
backend.add(import('@backstage/plugin-permission-backend/alpha'));
backend.add(import('./policy'));

// search plugin
backend.add(import('@backstage/plugin-search-backend'));
backend.add(import('@backstage/plugin-search-backend-module-catalog'));
backend.add(import('@backstage/plugin-search-backend-module-techdocs'));

backend.add(import('@backstage-community/plugin-matomo-backend'));
backend.add(import('@backstage-community/plugin-feedback-backend'));
backend.add(import('@backstage-community/plugin-report-portal-backend'));

backend.add(import('@spotify/backstage-plugin-soundcheck-backend'));
backend.add(
  import('@backstage/plugin-scaffolder-backend-module-notifications'),
);
backend.add(
  import(
    '@compass/backstage-plugin-soundcheck-backend-module-droperator'
  ),
);
backend.add(
  import(
    '@compass/backstage-plugin-soundcheck-backend-module-red-hat-core'
  ),
);
backend.add(
  import(
    '@compass/backstage-plugin-soundcheck-backend-module-red-hat-gitlab'
  ),
);
backend.add(
  import(
    '@compass/backstage-plugin-soundcheck-backend-module-red-hat-servicenow'
  ),
);
backend.add(
  import(
    '@compass/backstage-plugin-soundcheck-backend-module-red-hat-smartsheet'
  ),
);
backend.add(
  import(
    '@compass/backstage-plugin-soundcheck-backend-module-google-spreadsheets'
  ),
);
// DevTools backend
backend.add(import('@backstage/plugin-devtools-backend'));

backend.add(import('@compass/backstage-plugin-catalog-backend-module-mcp'));

backend.add(
  import('@appdev/backstage-plugin-devex-data-layer-backend'),
);
backend.add(
  import('@appdev/backstage-plugin-audit-compliance-backend'),
);

backend.add(
  import(
    '@compass/backstage-plugin-scaffolder-backend-module-custom-filters'
  ),
);
backend.add(
  import('@appdev/backstage-plugin-permission-management-backend'),
);
backend.add(import('@appdev/backstage-plugin-outage-template-backend'));
backend.add(import('@compass/backstage-plugin-mcp-actions-example-backend'));
backend.add(import('@backstage/plugin-mcp-actions-backend'));
backend.add(import('@appdev/backstage-plugin-gdpr-backend'));

backend.start();
