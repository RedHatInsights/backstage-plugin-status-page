import { createDevApp } from '@backstage/dev-utils';
import { essPlugin, EssPage } from '../src/plugin';

createDevApp()
  .registerPlugin(essPlugin)
  .addPage({
    element: <EssPage />,
    title: 'Root Page',
    path: '/compliance/ess',
  })
  .render();
