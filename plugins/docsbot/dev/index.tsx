import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { docsBotPlugin, DocsBotPage } from '../src/plugin';

createDevApp()
  .registerPlugin(docsBotPlugin)
  .addPage({
    element: <DocsBotPage />,
    title: 'Root Page',
    path: '/docsbot',
  })
  .render();
