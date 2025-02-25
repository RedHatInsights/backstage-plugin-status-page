import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { outageTemplatePlugin, OutageTemplatePage } from '../src/plugin';

createDevApp()
  .registerPlugin(outageTemplatePlugin)
  .addPage({
    element: <OutageTemplatePage />,
    title: 'Root Page',
    path: '/status-page',
  })
  .render();
