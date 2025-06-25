import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { redirectsPlugin } from '../src/plugin';
import { EntityProvider } from '@backstage/plugin-catalog-react';
import { catalogPlugin } from '@backstage/plugin-catalog';
import { stringifyEntityRef } from '@backstage/catalog-model';

const mockEntity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'test',
  },
};

createDevApp()
  .registerPlugin(catalogPlugin)
  .registerPlugin(redirectsPlugin)
  .addPage({
    title: 'Entity1',
    path: '/catalog/:namespace/:kind/:name',
    element: (
      <EntityProvider entity={mockEntity}>
        Loaded {stringifyEntityRef(mockEntity)}
      </EntityProvider>
    ),
  })
  .render();
