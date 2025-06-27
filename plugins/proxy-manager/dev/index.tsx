import { createDevApp } from '@backstage/dev-utils';
import { proxyManagerPlugin, ProxyManagerPage } from '../src/plugin';

createDevApp()
  .registerPlugin(proxyManagerPlugin)
  .addPage({
    element: <ProxyManagerPage />,
    title: 'Root Page',
    path: '/proxy-manager'
  })
  .render();
