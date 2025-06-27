import { createDevApp } from '@backstage/dev-utils';
import { getAllThemes } from '@redhat-developer/red-hat-developer-hub-theme';
import { workstreamAutomationPlugin, WorkstreamsPage } from '../src/plugin';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import {
  CatalogEntityPage,
  CatalogIndexPage,
  catalogPlugin,
} from '@backstage/plugin-catalog';
import { CatalogClient } from '@backstage/catalog-client';
import { discoveryApiRef, fetchApiRef } from '@backstage/core-plugin-api';

createDevApp()
  .registerPlugin(workstreamAutomationPlugin)
  .registerPlugin(catalogPlugin)
  .addThemes(getAllThemes())
  .registerApi({
    api: catalogApiRef,
    deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
    factory: deps => {
      return new CatalogClient(deps);
    },
  })
  .addPage({
    element: <WorkstreamsPage />,
    title: 'Root Page',
    path: '/workstream',
  })
  .addPage({
    element: <CatalogIndexPage />,
    title: 'Catalog Page',
    path: '/catalog',
  })
  .addPage({
    element: <CatalogEntityPage />,
    title: 'Entity Page',
    path: '/catalog/:namespace/:kind/:name',
  })
  .render();
