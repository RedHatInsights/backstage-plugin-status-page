import { createDevApp } from '@backstage/dev-utils';
import { statusPagePlugin, StatusPageComponent } from '../src/plugin';

createDevApp()
  .registerPlugin(statusPagePlugin)
  .addPage({
    element: <StatusPageComponent />,
    title: 'Root Page',
    path: '/status-page',
  })
  .render();
