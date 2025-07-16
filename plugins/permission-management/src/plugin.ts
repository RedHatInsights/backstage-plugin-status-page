import {
  AlertApi,
  alertApiRef,
  configApiRef,
  createApiFactory,
  createApiRef,
  createPlugin,
  createRoutableExtension,
  discoveryApiRef,
  fetchApiRef,
  FetchApi,
  DiscoveryApi,
  OAuthApi,
  oauthRequestApiRef,
  ProfileInfoApi,
  BackstageIdentityApi,
  SessionApi,
} from '@backstage/core-plugin-api';

import { OAuth2 } from '@backstage/core-app-api';
import { rootRouteRef } from './routes';
import { permissionManagementApiRef, PermissionManagementApi } from './api';

export const oauth2ApiRef = createApiRef<
  OAuthApi & ProfileInfoApi & BackstageIdentityApi & SessionApi
>({
  id: 'permission-management.auth.oauth2',
});

export const permissionManagementPlugin = createPlugin({
  id: 'permission-management',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: permissionManagementApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
        alertApi: alertApiRef,
      },
      factory: ({
        discoveryApi,
        fetchApi,
        alertApi,
      }: {
        discoveryApi: DiscoveryApi;
        fetchApi: FetchApi;
        alertApi: AlertApi;
      }) => new PermissionManagementApi({ discoveryApi, fetchApi, alertApi }),
    }),

    createApiFactory({
      api: oauth2ApiRef,
      deps: {
        configApi: configApiRef,
        discoveryApi: discoveryApiRef,
        oauthRequestApi: oauthRequestApiRef,
      },
      factory: options =>
        OAuth2.create({
          provider: {
            id: 'oauth2',
            title: 'Red Hat Internal SSO',
            icon: () => null,
          },
          ...options,
          defaultScopes: [''],
          environment: options.configApi.getOptionalString('auth.environment'),
        }),
    }),
  ],
});

export const PermissionManagementPage = permissionManagementPlugin.provide(
  createRoutableExtension({
    name: 'PermissionManagementPage',
    component: () =>
      import('./components/PermissionManagement').then(
        m => m.PermissionManagement,
      ),
    mountPoint: rootRouteRef,
  }),
);
