import { createDevApp } from '@backstage/dev-utils';
import { datasourcePlugin } from '../src/plugin';

createDevApp()
  .registerPlugin(datasourcePlugin)
  .addPage({
    element: <>Datasource Page</>,
    title: 'Root Page',
    path: '/datasource',
  })
  .render();
