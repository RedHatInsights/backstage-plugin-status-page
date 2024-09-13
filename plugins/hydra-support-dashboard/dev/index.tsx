import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { hydraSupportDashboardPlugin, HydraSupportDashboardPage } from '../src/plugin';

createDevApp()
  .registerPlugin(hydraSupportDashboardPlugin)
  .addPage({
    element: <HydraSupportDashboardPage />,
    title: 'Root Page',
    path: '/hydra-support-dashboard',
  })
  .render();
