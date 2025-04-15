import {
  createPlugin,
  createRoutableExtension
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const mcpPlugin = createPlugin({
  id: 'mcp',
  routes: {
    root: rootRouteRef,
  },
});

export const McpPage = mcpPlugin.provide(
  createRoutableExtension({
    name: 'McpPage',
    component: () =>
      import('./components/mcp').then(m => m.MCPServer),
    mountPoint: rootRouteRef,
  }),
);
