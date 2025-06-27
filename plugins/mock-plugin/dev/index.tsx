import { createDevApp } from '@backstage/dev-utils';
import { mockPluginPlugin, MockPluginPage } from '../src/plugin';

createDevApp()
  .registerPlugin(mockPluginPlugin)
  .addPage({
    element: <MockPluginPage />,
    title: 'Root Page',
    path: '/mock-plugin'
  })
  .render();
