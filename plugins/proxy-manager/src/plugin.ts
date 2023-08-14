import { OAuth2 } from '@backstage/core-app-api';
import { ApiRef, BackstageIdentityApi, configApiRef, createApiFactory, createApiRef, createPlugin, createRoutableExtension, discoveryApiRef, OAuthApi, oauthRequestApiRef, ProfileInfoApi, SessionApi } from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const oauth2ApiRef: ApiRef<
  OAuthApi & ProfileInfoApi & BackstageIdentityApi & SessionApi
> = createApiRef({
  id: 'proxy-manager.auth.oauth2',
});


export const proxyManagerPlugin = createPlugin({
  id: 'proxy-manager.auth.oauth2',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    /* OAuth2 API */
    createApiFactory({
      api: oauth2ApiRef,
      deps: {
        configApi: configApiRef,
        discoveryApi: discoveryApiRef,
        oauthRequestApi: oauthRequestApiRef,
      },
      factory: options => (
        OAuth2.create({
          provider: {
            id: 'oauth2',
            title: 'Red Hat Internal SSO',
            icon: () => null,
          },
          ...options,
          defaultScopes: [''],
          environment: options.configApi.getOptionalString('auth.environment'),
        })
      ),
    }),
  ],
});

export const ProxyManagerPage = proxyManagerPlugin.provide(
  createRoutableExtension({
    name: 'ProxyManagerPage',
    component: () =>
      import('./components/ContainerComponent').then(m => m.ContainerComponent),
    mountPoint: rootRouteRef,
  }),
);
