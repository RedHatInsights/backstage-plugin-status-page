import {
  createComponentExtension,
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const docsBotPlugin = createPlugin({
  id: 'docsbot',
  routes: {
    root: rootRouteRef,
  },
});
export const DocsBotButton = docsBotPlugin.provide(
  createComponentExtension({
    name: 'DocsBotButton',
    component: {
      lazy: () =>
        import('./components/DocsBotDrawer/DocsBotButton/DocsBotButton').then(
          m => m.DocsBotButton,
        ),
    },
  }),
);
export const DocsBotPanel = docsBotPlugin.provide(
  createComponentExtension({
    name: 'DocsBotPanel',
    component: {
      lazy: () =>
        import('./components/DocsBotDrawer').then(m => m.DocsBotDrawer),
    },
  }),
);

export const DocsBotPage = docsBotPlugin.provide(
  createRoutableExtension({
    name: 'DocsBotChatWindowExpanded',
    component: () =>
      import('./components/DocsBotPage').then(m => m.DocsBotPage),
    mountPoint: rootRouteRef,
  }),
);
