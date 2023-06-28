import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { analyticsModuleMatomoPlugin } from '../src/plugin';

createDevApp()
  .registerPlugin(analyticsModuleMatomoPlugin)
  .addPage({
    element: <div>Matomo Analytics Plugin</div>,
    title: 'Root Page',
    path: '/analytics-module-matomo',
  })
  .render();
