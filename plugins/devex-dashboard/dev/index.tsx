import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { devexDashboardPlugin, DevexDashboardPage } from '../src/plugin';

createDevApp()
  .registerPlugin(devexDashboardPlugin)
  .addPage({
    element: <DevexDashboardPage />,
    title: 'Root Page',
    path: '/devex-dashboard',
  })
  .render();
