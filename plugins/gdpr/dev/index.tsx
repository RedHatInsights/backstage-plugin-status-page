// @ts-ignore React is required for JSX in Material-UI v4
import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { gdprPlugin, GdprPage } from '../src/plugin';

createDevApp()
  .registerPlugin(gdprPlugin)
  .addPage({
    element: <GdprPage />,
    title: 'Root Page',
    path: '/gdpr',
  })
  .render();
