import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef, platformDetailRouteRef } from './routes';

export const essPlugin = createPlugin({
  id: 'ess',
  routes: {
    root: rootRouteRef,
    platformDetail: platformDetailRouteRef,
  },
});

export const EssPage = essPlugin.provide(
  createRoutableExtension({
    name: 'EssPage',
    component: () =>
      import('./components/PlatformsPage').then(m => m.PlatformsPage),
    mountPoint: rootRouteRef,
  }),
);

export const PlatformDetailPage = essPlugin.provide(
  createRoutableExtension({
    name: 'PlatformDetailPage',
    component: () =>
      import('./components/PlatformDetailPage').then(m => m.PlatformDetailPage),
    mountPoint: rootRouteRef,
  }),
);
