import { createPlugin, createRoutableExtension } from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const mockPluginPlugin = createPlugin({
  id: 'mock-plugin',
  routes: {
    root: rootRouteRef,
  },
});

export const MockPluginPage = mockPluginPlugin.provide(
  createRoutableExtension({
    name: 'MockPluginPage',
    component: () =>
      import('./components/ExampleComponent').then(m => m.ExampleComponent),
    mountPoint: rootRouteRef,
  }),
);
