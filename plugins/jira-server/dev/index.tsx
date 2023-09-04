import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { jiraPlugin } from '../src/plugin';

createDevApp()
  .registerPlugin(jiraPlugin)
  .addPage({
    element: <div>JIRA Server</div>,
    title: 'Root Page',
    path: '/jira-server',
  })
  .render();
