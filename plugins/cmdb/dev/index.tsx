import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { cmdbPlugin, CmdbPage } from '../src/plugin';

createDevApp()
  .registerPlugin(cmdbPlugin)
  .addPage({
    element: <CmdbPage />,
    title: 'Root Page',
    path: '/cmdb'
  })
  .render();
