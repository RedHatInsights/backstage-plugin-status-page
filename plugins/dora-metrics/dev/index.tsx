import { createDevApp } from '@backstage/dev-utils';
import { doraMetricsPlugin, DoraMetricsPage } from '../src/plugin';

createDevApp()
  .registerPlugin(doraMetricsPlugin)
  .addPage({
    element: <DoraMetricsPage />,
    title: 'Root Page',
    path: '/dora-metrics',
  })
  .render();
