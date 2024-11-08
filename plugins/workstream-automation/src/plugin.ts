import {
  createComponentExtension,
  createPlugin,
  createRoutableExtension,
  DiscoveryApi,
  discoveryApiRef,
  FetchApi,
  fetchApiRef,
  IdentityApi,
  identityApiRef,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';
import { WorkstreamApi, workstreamApiRef } from './api';

export const workstreamAutomationPlugin = createPlugin({
  id: 'workstream-automation',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    {
      api: workstreamApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
        identityApi: identityApiRef,
      },
      factory(deps: {
        discoveryApi: DiscoveryApi;
        fetchApi: FetchApi;
        identityApi: IdentityApi;
      }) {
        return new WorkstreamApi(deps);
      },
    },
  ],
});

export const WorkstreamsPage = workstreamAutomationPlugin.provide(
  createRoutableExtension({
    name: 'workstream-automation',
    mountPoint: rootRouteRef,
    component: () =>
      import('./components/WorkstreamTable').then(m => m.CustomCatalogPage),
  }),
);

export const WorkstreamAboutCard = workstreamAutomationPlugin.provide(
  createComponentExtension({
    name: 'WorkstreamAboutCard',
    component: {
      lazy: () =>
        import('./components/WorkstreamAboutCard').then(
          m => m.WorkstreamAboutCard,
        ),
    },
  }),
);

export const WorkstreamMembersCard = workstreamAutomationPlugin.provide(
  createComponentExtension({
    name: 'WorkstreamMembersCard',
    component: {
      lazy: () =>
        import('./components/WorkstreamMembersCard').then(
          m => m.WorkstreamMembersCard,
        ),
    },
  }),
);

export const WorkstreamPortfolioCard = workstreamAutomationPlugin.provide(
  createComponentExtension({
    name: 'WorkstreamPortfolioCard',
    component: {
      lazy: () =>
        import('./components/WorkstreamPortfolioCard').then(
          m => m.WorkstreamPortfolioCard,
        ),
    },
  }),
);

export const UserWorkstreamCard = workstreamAutomationPlugin.provide(
  createComponentExtension({
    name: 'UserWorkstreamCard',
    component: {
      lazy: () =>
        import('./components/UserWorkstreamCard').then(
          m => m.UserWorkstreamCard,
        ),
    },
  }),
);

export const WorkstreamLinksCard = workstreamAutomationPlugin.provide(
  createComponentExtension({
    name: 'WorkstreamLinksCard',
    component: {
      lazy: () =>
        import('./components/WorkstreamLinksCard').then(
          m => m.WorkstreamLinksCard,
        ),
    },
  }),
);
