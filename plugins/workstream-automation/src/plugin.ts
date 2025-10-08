import {
  AlertApi,
  alertApiRef,
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

import {
  ArtApiClient,
  artApiRef,
  NoteApiClient,
  noteApiRef,
  WorkstreamApiClient,
  workstreamApiRef,
} from './api';
import { dashboardRouteRef, rootRouteRef } from './routes';

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
        return new WorkstreamApiClient(deps);
      },
    },
    {
      api: artApiRef,
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
        return new ArtApiClient(deps);
      },
    },
    {
      api: noteApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
        alertApi: alertApiRef,
      },
      factory(deps: {
        discoveryApi: DiscoveryApi;
        fetchApi: FetchApi;
        alertApi: AlertApi;
      }) {
        return new NoteApiClient(
          deps.alertApi,
          deps.discoveryApi,
          deps.fetchApi,
        );
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

export const EntityWorkstreamCard = workstreamAutomationPlugin.provide(
  createComponentExtension({
    name: 'EntityWorkstreamCard',
    component: {
      lazy: () =>
        import('./components/EntityWorkstreamCard').then(
          m => m.EntityWorkstreamCard,
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

export const CreateArtModal = workstreamAutomationPlugin.provide(
  createComponentExtension({
    name: 'CreateNewArt',
    component: {
      lazy: () =>
        import('./components/CreateArtModal').then(m => m.CreateArtModal),
    },
  }),
);

export const ArtMembersCard = workstreamAutomationPlugin.provide(
  createComponentExtension({
    name: 'ArtMembersCard',
    component: {
      lazy: () =>
        import('./components/Art/ArtMembersCard').then(m => m.ArtMembersCard),
    },
  }),
);

export const ArtAboutCard = workstreamAutomationPlugin.provide(
  createComponentExtension({
    name: 'ArtAboutCard',
    component: {
      lazy: () =>
        import('./components/Art/ArtAboutCard').then(m => m.ArtAboutCard),
    },
  }),
);

export const WorkstreamDashboardPage = workstreamAutomationPlugin.provide(
  createRoutableExtension({
    name: 'workstream-dashboard-page',
    mountPoint: dashboardRouteRef,
    component: () =>
      import('./components/WorkstreamDashboardPage').then(
        m => m.WorkstreamDashboardPage,
      ),
  }),
);

export const WorkstreamDashboardContent = workstreamAutomationPlugin.provide(
  createComponentExtension({
    name: 'WorkstreamDashboardContent',
    component: {
      lazy: () =>
        import('./components/WorkstreamDashboardPage').then(
          m => m.WorkstreamDashboardContent,
        ),
    },
  }),
);
