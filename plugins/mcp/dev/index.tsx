import { createDevApp } from '@backstage/dev-utils';
import { mcpPlugin, McpPage } from '../src/plugin';

createDevApp()
  .registerPlugin(mcpPlugin)
  .addPage({
    element: <McpPage />,
    title: 'Root Page',
    path: '/mcp',
  })
  .render();
