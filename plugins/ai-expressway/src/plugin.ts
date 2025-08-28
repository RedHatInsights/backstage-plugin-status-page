import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const aiExpresswayPlugin = createPlugin({
  id: 'ai-expressway',
  routes: {
    root: rootRouteRef,
  },
});

export const AIExpresswayCard = aiExpresswayPlugin.provide(
  createRoutableExtension({
    name: 'AIExpresswayCard',
    component: () =>
      import('./components/DetailsCard').then(m => m.DetailsCard),
    mountPoint: rootRouteRef,
  }),
);
