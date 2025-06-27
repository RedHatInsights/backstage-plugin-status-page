import { createDevApp } from '@backstage/dev-utils';
import { lighthousePlugin, LighthousePage } from '../src/plugin';

createDevApp()
  .registerPlugin(lighthousePlugin)
  .addPage({
    element: <LighthousePage />,
    title: 'Root Page',
    path: '/lighthouse'
  })
  .render();
