import { createDevApp } from '@backstage/dev-utils';
import { spashipPlugin, SpashipGlobalPage } from '../src/plugin';

createDevApp()
  .registerPlugin(spashipPlugin)
  .addPage({
    element: <SpashipGlobalPage />,
    title: 'Root Page',
    path: '/spaship',
  })
  .render();
