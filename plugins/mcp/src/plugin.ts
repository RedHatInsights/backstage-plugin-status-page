import { createComponentExtension, createPlugin } from '@backstage/core-plugin-api';

export const mcpPlugin = createPlugin({
  id: 'mcp',
});

export const MCPPrimitives = mcpPlugin.provide(
  createComponentExtension({
    name: 'MCPPrimitives',
    component: {
      lazy: () => import('./components/Primitives').then(m => m.MCPPrimitives),
    },
  }),
);

export const MCPLinks = mcpPlugin.provide(
  createComponentExtension({
    name: 'MCPLinks',
    component: {
      lazy: () => import('./components/Links').then(m => m.MCPLinks),
    },
  }),
);
