import { createDevApp } from '@backstage/dev-utils';
import { catalogIndexPlugin, CatalogPage } from '../src/plugin';

createDevApp()
  .registerPlugin(catalogIndexPlugin)
  .addPage({
    element: <CatalogPage />,
    title: 'Root Page',
    path: '/catalog-index',
  })
  .render();
